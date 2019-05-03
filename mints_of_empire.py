"""
1. from (a) an xlsx file (containing data on which mint operated in which years,
for which dynasty), and (b) a kml file that contains the coordinates of the mints, create:
  * a geojson file that has the end and starting dates for the interval during which each
    feature should be shown on the map
  * a js file that facilitates the import of the geojson file

Such geojson and js files are created for each metal (AU, AR, AE),
and for "year" and "decade" display modes.
    (this will allow a different shape for each metal,
    and checkboxes so the user can choose which metals to see)
in the javascript in the html file, the geojson data for each metal type
is loaded into the same timeline

    
each dynasty/minting authority is given a different colour
NB: if you want a specific colour for a dynasty,
    add it to the colour_dict; if the dynasty is not in the colour_dict,
    a random colour will be created

for some reason, the leaflet timeline does not show dates before 200;
for this reason, the hijri dates are converted to Gregorian dates.


NB: you can use the save_csv function to save a csv
that contains all the coordinates given in the xlsx file,
or temp coordinates for places without coordinates.
This csv can then be used in a GIS program (or converted to kml, in Google Earth)
to produce the kml file. 

"""


import simplekml
from openpyxl import *
from bs4 import BeautifulSoup

import datetime
import json
import copy
import re
import random

from hijri_converter import to_gregorian



geojson = {"type": "FeatureCollection",
           "features": [],
           }
geojson_feature =   {"type": "Feature",
                     "properties": {"name": "",
                                    "start": "", # yyyy-mm-dd
                                    "end": "",
                                    "ref": "",
                                    "dates": "",
                                    "notes": "",
                                    "marker_size": "",
                                    "marker_colour": "",
                                    "version": "",
                                    "version_date": "",
                                    "dynasty": "",
                                    },
                     "geometry": {"type": "", # Point or LineString
                                  "coordinates": [] # list for point, list of lists for line
                                  }
                     }


current_id = 0
current_id_year = 0

def load_xlsx_sheet(fp, sheetname):
    """load the data from the Excel sheet into a list of lists (rows, cells)"""
    wb = load_workbook(fp, data_only=True)
    ws = wb[sheetname]
    data = []
    for row in ws.rows:
        current_row = []
        for cell in row:
            current_row.append(cell.value)
        data.append(current_row)
    return data

def write_geojson(outpth, data):
    """dump the geojson data to the given outpth"""
    with open(outpth, mode="w", encoding="utf-16") as outfile:
        json.dump(data, outfile, ensure_ascii=False, indent=4, sort_keys=True)
        

def geojson2js(inpth, outpth, var_name):
    """write a javascript file that attributes the geojson to the variable varname.
    This makes it possible to import the geojson also locally,
    without AJAX calls etc."""
    with open(inpth, mode="r", encoding="utf-16") as file:
        data = file.read()
    with open(outpth, mode="w", encoding="utf-16") as outfile:
        outfile.write("var {} = {}".format(var_name, data))

def generate_dyn_dict(dyn_data):
    """turn the list of dynasties and their abbreviations into a dictionary"""
    dyn_dict = dict()
    for line in dyn_data:
        dyn_dict[line[0]] = line[1]
    return dyn_dict


def degree2dec(coord):
    """Turn degrees-minutes-seconds coordinates into decimal coordinates"""
    if coord[-1] == "W":
        EW = -1
    else:
        EW = 1
    degr = coord[0:2]
    minutes = coord[3:5]
    dec = int(minutes)/60
    return EW * (int(degr) + dec)

def generate_colour():
    """generate random colours"""
    #from colorutils import random_web
    #return random_web()
    r = lambda: random.randint(0,255)
    return "#%02X%02X%02X" % (r(), r(), r())
    

def get_mints(data):
    """extract all mints from the Excel sheet,
    with their coordinates if those are given in the relevant column;
    if not, attribute a temporary coordinate (30,30).
    Save in a dictionary {mint_name: {latitude: x, longitude: y}}"""
    mints = {}
    for i, line in enumerate(data[1:]):
        if line[0]:
            if line[1] not in mints:
                print(line[1], line[7])
                mints[line[1]] = {"latitude": 30, "longitude": 30}
            if line[7]:
                lat = re.findall(r"\d+d\d+' N", line[7])
                if lat:
                    mints[line[1]]["latitude"] = degree2dec(lat[0])
                lon = re.findall(r"\d+d\d+' [EW]", line[7])
                if lon:
                    mints[line[1]]["longitude"] = degree2dec(lon[0])           
    return mints

def save_csv(mints, fp):
    """save the mints with their coordinates as a csv file"""
    csv ="mint,lat,lon"
    for m in mints:
        csv += "\n{},{},{}".format(m, mints[m]["latitude"], mints[m]["longitude"])
    print(csv)
    with open(fp, mode="w", encoding="utf-8") as file:
        file.write(csv)


def load_kml_data(kml_fp):
    """take the relevant data from the kml file;
    return a list of lists [[lon,lat,Name,description], ]"""
    with open(kml_fp, mode="r", encoding="utf-8") as file:
        s = BeautifulSoup(file, "xml")
    all_places = []
    for placemark in s.find_all("Placemark"):
        if placemark.find('coordinates'):
            coordinates = placemark.find('coordinates').string
            place = coordinates.split(",")[:2]
        if placemark.find('name'):
            name = placemark.find('name').string
        else:
            name = "None"
        place.append(name)
        if placemark.find('description'):
            description = placemark.find('description').string
        else:
            description = ""
        place.append(description)
        #print(place)
        all_places.append(place)
    return all_places

def load_coordinates(kml_fp, separator=",", encoding="utf-8"):
    """load the coordinate data from the kml file.
    Return a dictionary {mint_name: [lon, lat]}"""
    data = load_kml_data(kml_fp)
    coord = {}
    for i, line in enumerate(data):
        #print(i, line[2])
        coord[line[2]] = [float(line[0]), float(line[1])]
    return coord

def date2int(date, decade=False):
    """create an integer version of the (year of the) date;
    if decade == True: return an integer for the decade of the year"""
    try:
        date = re.sub("x", "5", str(date)) # if a digit of the year cannot be read, replace by 5
        #remove non-digit characters:
        date = re.sub("ca", "", date)
        date = re.sub("CA", "", date)
        date = re.sub("[\[\]]", "", date)
        if decade:
            return int(date[:-1])*10
        else:
            return int(date)
    except Exception as e:
        print("problem finding decade for date {}: {}", format(date, e))
    

def get_dynasty_list(cell):
    """get a list of all dynasties producing coins of the given metal type
    at the given date in the given mint"""
    cell = re.sub("\?", "", cell) #remove question marks in the Excel input
    return cell.split(",")



def compile_notes(d):
    """get the notes from the Excel sheet for each year in the decade
    and format them as list elements for the html file"""
    note = ""
    for e, date in enumerate(d["dates"]):
        if d["notes"][e]:
            note += "<li>year {}: {}</li>".format(date, d["notes"][e])
    return note

def compile_references(d):
    """get the references from the Excel sheet for each year in the decade.
    return them in  a list."""
    refs = []
    for e, date in enumerate(d["dates"]):
        if d["references"][e] not in refs:
            refs.append(d["references"][e])
    return refs


def add_to_dic(data_dict, year_dict, place, dyn, metal, decade, date, note, reference):
    """add data to the dictionaries containing the main data for the geojson output;
    data_dict cointains the data for the decade display, year_dict for the year display"""
    if place not in data_dict:
        data_dict[place] = {}
    if dyn not in data_dict[place]:
        data_dict[place][dyn] = {}
    if metal not in data_dict[place][dyn]:
        data_dict[place][dyn][metal] = {}
    if decade not in data_dict[place][dyn][metal]:
        data_dict[place][dyn][metal][decade] = {}
        data_dict[place][dyn][metal][decade]["dates"] = []
        data_dict[place][dyn][metal][decade]["notes"] = []
        data_dict[place][dyn][metal][decade]["references"] = []
    data_dict[place][dyn][metal][decade]["dates"].append(str(date))
    data_dict[place][dyn][metal][decade]["notes"].append(note)
    data_dict[place][dyn][metal][decade]["references"].append(reference)
    
    if place not in year_dict:
        year_dict[place] = {}
    if dyn not in year_dict[place]:
        year_dict[place][dyn] = {}
    if metal not in year_dict[place][dyn]:
        year_dict[place][dyn][metal] = {}
    if date2int(date) not in year_dict[place][dyn][metal]:
        year_dict[place][dyn][metal][date2int(date)] = {}
        year_dict[place][dyn][metal][date2int(date)]["dates"] = []
        year_dict[place][dyn][metal][date2int(date)]["notes"] = []
        year_dict[place][dyn][metal][date2int(date)]["references"] = []
    year_dict[place][dyn][metal][date2int(date)]["dates"].append(str(date))
    year_dict[place][dyn][metal][date2int(date)]["notes"].append(note)
    year_dict[place][dyn][metal][date2int(date)]["references"].append(reference)
    return data_dict, year_dict


def generate_ref_dict(data_dict, year_dict):
    """create a dictionary that contains all the references
    to a place in one year (ref_dict_year) or decade (ref_dict).
    This has to be a separate dictionary from the data_dict and year_dict,
    because the references are combined independent of
    the metal type and minting authority/dynasty"""
    ref_dict = dict()
    ref_dict_year = dict()
    for place in data_dict:
        ref_dict[place] = {}
        ref_dict_year[place] = {}
        for dyn in data_dict[place]:
            if dyn not in dyns_to_be_excluded:
                for metal in data_dict[place][dyn]:
                    if metal in metal_list:
                        for year in year_dict[place][dyn][metal]:
                            if year not in ref_dict_year[place]:
                                ref_dict_year[place][year] = []
                            refs = year_dict[place][dyn][metal][year]["references"]
                            for ref in refs:
                                if ref not in ref_dict_year[place][year]:
                                    ref_dict_year[place][year].append(ref)
                        for decade in data_dict[place][dyn][metal]:
                            if decade not in ref_dict[place]:
                                ref_dict[place][decade] = []
                            refs = compile_references(data_dict[place][dyn][metal][decade])
                            for ref in refs:
                                if ref not in ref_dict[place][decade]:
                                    ref_dict[place][decade].append(ref)
    return ref_dict, ref_dict_year

def generate_descr_dict(data_dict, year_dict, metal_list, dyns_to_be_excluded, dyn_dict, metal_dict):
    """generate a dictionary that contains
    per place and per decade (descr_dict) / year (descr_dict_year)
    the descriptions that should be displayed in the webpage popups.
    These popups gather the data from all metals and dynasties
    at the same place and the same year"""
    descr_dict = dict()
    descr_dict_year = dict()
    for place in data_dict:
        descr_dict[place] = {}
        descr_dict_year[place] = {}
        for dyn in data_dict[place]:
            if dyn not in dyns_to_be_excluded:
                for metal in data_dict[place][dyn]:
                    if metal in metal_list:
                        for year in year_dict[place][dyn][metal]:
                            #print(year)
                            if year not in descr_dict_year[place]:
                                greg_year_start = to_gregorian(date2int(year),1,1)
                                greg_year_end = to_gregorian(date2int(year),12,29)
                                descr_dict_year[place][year] = "<h1>{}, {} AH ({}-{} CE)</h1>".format(place, year,
                                                                                                   greg_year_start[0], greg_year_end[0])
                            dates = ", ".join(year_dict[place][dyn][metal][year]["dates"])
                            if "," in dates:
                                descr_dict_year[place][year] += '<div class="popupDynMetal">{} {}: years {} AH</div>'.format(dyn_dict[dyn], metal_dict[metal], dates)
                            else:
                                descr_dict_year[place][year] += '<div class="popupDynMetal">{} {}: year {} AH</div>'.format(dyn_dict[dyn], metal_dict[metal], dates)
                            notes = compile_notes(year_dict[place][dyn][metal][year])
                            if notes:
                                #print(descr_dict_year[place][year])
                                descr_dict_year[place][year] += '<div class="popupNotes">Notes: <ul class="notesList">{}</ul></div>'.format(notes)
##                            refs = ref_dict_year[place][year]
##                            if refs:
##                                descr_dict_year[place][year] += "<p>References: {}</p>".format("; ".join(sorted(refs)))
                                
                            
                                
                        for decade in data_dict[place][dyn][metal]:
                            if decade not in descr_dict[place]:
                                greg_dec_start = to_gregorian(decade,1,1)
                                greg_dec_end = to_gregorian(decade+9,12,31)
                                descr_dict[place][decade] = "<h1>{}, {}s AH ({}-{} CE)</h1>".format(place, decade,
                                                                                                    greg_dec_start[0], greg_dec_end[0])
                            #descr_dict[place][decade] += "<h2>{} {}:</h2>".format(dyn_dict[dyn], metal_dict[metal])
                            dates = ", ".join(data_dict[place][dyn][metal][decade]["dates"])
                            if "," in dates:
                                descr_dict[place][decade] += '<div class="popupDynMetal">{} {}: years {} AH</div>'.format(dyn_dict[dyn], metal_dict[metal], dates)
                            else:
                                descr_dict[place][decade] += '<div class="popupDynMetal">{} {}: year {} AH</div>'.format(dyn_dict[dyn], metal_dict[metal], dates)
                            notes = compile_notes(data_dict[place][dyn][metal][decade])
                            if notes:
                                descr_dict[place][decade] += '<div class="popupNotes">Notes: <ul class="notesList">{}</ul></div>'.format(notes)
##                            refs = ref_dict[place][decade]
##                            if refs:
##                                descr_dict[place][decade] += "<p>References: {}</p>".format("; ".join(sorted(refs)))
    return descr_dict, descr_dict_year
                        
                    
                            
                        
    
    

def load_features(data, colour_dict, dyns_to_be_excluded):
    """columns in the xlsx file containing the mint data:
    0: number
    1: mint
    2: year
    3: AU
    4: AR
    5: AE
    6: notes
    7: mint identification notes
    8: reference
    for every line in the xlsx sheet, get the date of the line
    check in which decade the date belongs (int; take care of ca and x!)
    save in dict: {place:
                    {dynasty:
                      {metal: 
                        {decade:
                          {"dates": [],
                           "notes": [],
                           }
                        }
                      }
                    }
    """
    data_dict = dict()
    year_dict = dict()
    #print(data[:3])
    for i, line in enumerate(data[1:]):
        if line[0]:
            try:
                place = line[1]
                date = line[2]
                if line[6]:
                    note = line[6]
                else:
                    note = ""
                if line[8]:
                    reference = line[8]
                else:
                    reference = ""
                #print(date)
                decade = date2int(date, decade=True)
                #print(place, date, decade)
                for j, metal in enumerate(["AU", "AR", "AE"]):  
                    if line[j+3]:
                        #print(metal, line[j+3])
                        dynasties = get_dynasty_list(line[j+3])
                        #print(dynasties)
                        for dyn in dynasties:
                            if dyn not in dyns_to_be_excluded: 
                                data_dict, year_dict = add_to_dic(data_dict, year_dict, place,
                                                                  dyn, metal, decade, date, note, reference)
                                if dyn not in colour_dict:
                                    colour_dict[dyn] = generate_colour()
                        
                                
                
            except Exception as e:
                print(e)
                print("error in line", i, line)
            #print(data_dict)
            #input()
    print(colour_dict)
    return data_dict, year_dict, colour_dict
        

def make_geojson(data_dict, year_dict, coord, descr_dict, descr_dict_year,
                 dyn_dict, ref_dict, ref_dict_year,
                 version, version_date, metal_list=["AU","AR","AE"]):
    """create geojson files from the dictionaries containing the data
    ordered by decade (data_dict) and year (year_dict)"""
    geojson_coll = copy.deepcopy(geojson)
    geojson_coll_year = copy.deepcopy(geojson)
    for place in data_dict:
        for dyn in data_dict[place]:
            for metal in data_dict[place][dyn]:
                if metal in metal_list:
                    for decade in data_dict[place][dyn][metal]:
                        feat = copy.deepcopy(geojson_feature)
                        feat["geometry"]["type"] = "Point"
                        feat["geometry"]["coordinates"] = coord[place]
                        feat["properties"]["name"] = place
##                        feat["properties"]["start"] = str(decade+600)+"-01-01"
##                        feat["properties"]["end"] = str(decade+9+600)+"-12-31"
                        feat["properties"]["start"] = "{}-{}-{}".format(*to_gregorian(decade,1,1))
                        feat["properties"]["end"] = "{}-{}-{}".format(*to_gregorian(decade+9,12,1))
                        feat["properties"]["dates"] = ", ".join(data_dict[place][dyn][metal][decade]["dates"])
                        feat["properties"]["marker_size"] = len(data_dict[place][dyn][metal][decade]["dates"])                    
                        feat["properties"]["marker_colour"] = colour_dict[dyn]
                        feat["properties"]["dynasty"] = dyn_dict[dyn]
                        feat["properties"]["dynasty_abbreviation"] = dyn
                        feat["properties"]["notes"] = compile_notes(data_dict[place][dyn][metal][decade])
                        feat["properties"]["references"] = ref_dict[place][decade]
                        feat["properties"]["version"] = version
                        feat["properties"]["version_date"] = version_date
                        feat["properties"]["descr"] = descr_dict[place][decade]
                        refs = ref_dict[place][decade]
                        if refs:
                            feat["properties"]["descr"] += '<div class="popupRefs">References: {}</div>'.format("; ".join(sorted(refs)))
                        feat["properties"]["decade"] = decade
                        feat["properties"]["metal"] = metal
                        global current_id
                        current_id += 1
                        feat["properties"]["id"] = current_id
                        geojson_coll["features"].append(feat)
                        #feat["properties"]["start"] = "{}-{}-{}".format(*to_gregorian(decade,1,1))
                    for year in year_dict[place][dyn][metal]:
                        feat = copy.deepcopy(geojson_feature)
                        feat["geometry"]["type"] = "Point"
                        feat["geometry"]["coordinates"] = coord[place]
                        feat["properties"]["name"] = place
                        feat["properties"]["start"] = "{}-{}-{}".format(*to_gregorian(year,1,1))
                        feat["properties"]["end"] = "{}-{}-{}".format(*to_gregorian(year,12,28))
                        feat["properties"]["dates"] = ", ".join(year_dict[place][dyn][metal][year]["dates"])
                        feat["properties"]["marker_size"] = 3
                        feat["properties"]["marker_colour"] = colour_dict[dyn]
                        feat["properties"]["dynasty"] = dyn_dict[dyn]
                        feat["properties"]["dynasty_abbreviation"] = dyn
                        feat["properties"]["notes"] = compile_notes(year_dict[place][dyn][metal][year])
                        feat["properties"]["references"] = ref_dict_year[place][year]
                        feat["properties"]["descr"] = descr_dict_year[place][year]
                        refs = ref_dict_year[place][year]
                        if refs:
                            feat["properties"]["descr"] += '<div class="popupRefs">References: {}</div>'.format("; ".join(sorted(refs)))
                        feat["properties"]["version"] = version
                        feat["properties"]["version_date"] = version_date
                        feat["properties"]["decade"] = decade
                        feat["properties"]["metal"] = metal
                        global current_id_year
                        current_id_year += 1
                        feat["properties"]["id"] = current_id_year
                        geojson_coll_year["features"].append(feat)
                        
        
    return geojson_coll, geojson_coll_year

    
##version = 0
##version_date = str(datetime.datetime.now())
##
##
##xlsx_fp = "mints_of_empire_Diler.xlsx"
##data = load_xlsx_sheet(xlsx_fp, "Diler")
##mints = get_mints(data)
####save_csv(mints, "mints.csv")
##
##dyn_data = load_xlsx_sheet(xlsx_fp, "abbreviations")
##dyn_dict = generate_dyn_dict(dyn_data)
##
##kml_fp = "mints_corrected.kml"
##coord = load_coordinates(kml_fp)
###print(coord)
##
##metal_list = ["AU", "AR", "AE"]
##dyns_to_be_excluded = ["AS", "BZ", "AZ", "AL", "DB", "AE"]

def main(xlsx_fp, kml_fp, dyns_to_be_excluded, colour_dict,
         metal_list = ["AU", "AR", "AE"], version=0, save_mint_csv=False):
    
    version_date = str(datetime.datetime.now())

    metal_dict = {"AU": "gold coins",
              "AR": "silver coins",
              "AE": "copper coins"}    
    
    data = load_xlsx_sheet(xlsx_fp, "Diler")
    mints = get_mints(data)
    if save_mint_csv:
        save_csv(mints, "source_data/mints.csv")
    dyn_data = load_xlsx_sheet(xlsx_fp, "abbreviations")
    dyn_dict = generate_dyn_dict(dyn_data)

    coord = load_coordinates(kml_fp)
        
        
    data_dict, year_dict, colour_dict = load_features(data, colour_dict, dyns_to_be_excluded)
    ref_dict, ref_dict_year = generate_ref_dict(data_dict, year_dict)
    descr_dict, descr_dict_year = generate_descr_dict(data_dict, year_dict, metal_list, dyns_to_be_excluded,
                                                      dyn_dict, metal_dict)

    if "AU" in metal_list:
        AU_mints_geojson, AU_mints_year_geojson = make_geojson(data_dict, year_dict, coord,
                                                               descr_dict, descr_dict_year, dyn_dict,
                                                               ref_dict, ref_dict_year,
                                                               version, version_date, metal_list=["AU",])
        write_geojson("data/AU_mints.geojson", AU_mints_geojson)
        geojson2js("data/AU_mints.geojson", "data/import_AU_mints_geojson.js", "AU_mints")
        write_geojson("data/AU_mints_year.geojson", AU_mints_year_geojson)
        geojson2js("data/AU_mints_year.geojson", "data/import_AU_mints_year_geojson.js", "AU_mints_year")

    if "AR" in metal_list:
        AR_mints_geojson, AR_mints_year_geojson = make_geojson(data_dict, year_dict, coord,
                                                               descr_dict, descr_dict_year, dyn_dict,
                                                               ref_dict, ref_dict_year,
                                                               version, version_date, metal_list=["AR",])
        write_geojson("data/AR_mints.geojson", AR_mints_geojson)
        geojson2js("data/AR_mints.geojson", "data/import_AR_mints_geojson.js", "AR_mints")
        write_geojson("data/AR_mints_year.geojson", AR_mints_year_geojson)
        geojson2js("data/AR_mints_year.geojson", "data/import_AR_mints_year_geojson.js", "AR_mints_year")

    if "AE" in metal_list:
        AE_mints_geojson, AE_mints_year_geojson = make_geojson(data_dict, year_dict, coord,
                                                               descr_dict, descr_dict_year, dyn_dict,
                                                               ref_dict, ref_dict_year,
                                                               version, version_date, metal_list=["AE"])
        write_geojson("data/AE_mints.geojson", AE_mints_geojson)
        geojson2js("data/AE_mints.geojson", "data/import_AE_mints_geojson.js", "AE_mints")
        write_geojson("data/AE_mints_year.geojson", AE_mints_year_geojson)
        geojson2js("data/AE_mints_year.geojson", "data/import_AE_mints_year_geojson.js", "AE_mints_year")


if __name__ == "__main__":

    xlsx_fp = "source_data/mints_of_empire_Diler.xlsx"
    kml_fp = "source_data/mints_corrected.kml"
    metal_list = ["AU", "AR", "AE"]
    dyns_to_be_excluded = ["AS", "BZ", "AZ", "AL", "DB", "AE"]
    colour_dict = {"UM": "green",
                   "AB": "black",
                   "US": "green"}

    main(xlsx_fp, kml_fp, dyns_to_be_excluded, colour_dict, 
         metal_list = metal_list, version=0, save_mint_csv=False)
