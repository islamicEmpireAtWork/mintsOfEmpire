"""
This hijri converter mimics R.H. van Gent's online converter
(http://www.staff.science.uu.nl/~gent0113/islam/islam_tabcal.htm)

Currently, it only works from Hijri to Gregorian date, not vice versa.

The following functions are taken from ICLib:
(https://github.com/fikr4n/iclib-python)
* gregorian_to_jd()
* jd_to_gregorian()
* jd_to_weekday()
* adjust_jd_hour()
and part of the to_gregorian() function
"""

import math
import re

def gregorian_to_jd(y, m, d):
	"""Return Julian Day of a Gregorian or Julian date

	Negative Julian Day (i.e. y < -4712 or 4713 BC) is not supported.
	
	Param:
	y as int - year
	m as int - month [1..12]
	d as int - day [1..31]
	"""
	if y < -4712: raise ValueError('year < -4712 is not supported')

	if m <= 2:
		m += 12; y -= 1
	if y > 1582 or (y == 1582 and (m > 10 or (m == 10 and d >= 15))):
		# first gregorian is 15-oct-1582
		a = math.floor(y / 100.0)
		b = 2 + math.floor(a / 4.0) - a
	else: # invalid dates (5-14) are also considered as julian
		b = 0
	abs_jd = (1720994.5 + math.floor(365.25 * y) + math.floor(30.6001 * (m + 1))
		+ d + b)
	return abs_jd

def jd_to_gregorian(jd):
	"""Return Gregorian or Julian date of Julian Day

	Negative Julian Day < -0.5 is not supported.

	Return:
	int - year
	int - month [1..12]
	int - day [1..31]
	"""
	if jd < -0.5: raise ValueError('Julian Day < -0.5 is not supported')

	jd1 = jd + 0.5
	z = math.floor(jd1)
	f = jd1 - z
	if z < 2299161:
		a = z
	else:
		aa = math.floor((z - 1867216.25) / 36524.25)
		a = z + 1 + aa - math.floor(aa / 4.0)
	b = a + 1524
	c = math.floor((b - 122.1) / 365.25)
	d = math.floor(365.25 * c)
	e = math.floor((b - d) / 30.6001)
	day = b - d - math.floor(30.6001 * e) + f
	month = e - 1 if e < 14 else e - 13
	year = c - 4715 if month <= 2 else c - 4716
	return (int(year), int(month), int(day))

def jd_to_weekday(jd):
	"""Return weekday of Julian Day

	Return:
	int - weekday [1..7] where 1 is Ahad/Sunday
	"""
	return int(math.floor(jd + 1.5) % 7) + 1

def adjust_jd_hour(jd, hours):
	"""Return Julian Day with added hours"""
	return jd + hours / 24.0


def cal_types(calendar_type):
	"""
	Define the julian date of the hijra and the intercalary years, according to the different
	calendar types: see http://www.staff.science.uu.nl/~gent0113/islam/islam_tabcal.htm
	and http://www.staff.science.uu.nl/~gent0113/islam/islam_tabcal_variants.htm
	"""
	calendar_types = {"1" : [2, 5, 7, 10, 13, 15, 18, 21, 24, 26, 29], # intercalary years
                          "2" : [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29],
                          "3" : [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29],
                          "4" : [2, 5, 8, 11, 13, 16, 19, 21, 24, 27 & 30],
                          "a" : 1948439, # julian date of the hijra, 1.1.1 AH (1st of Muharram 1 AH)
                          "c" : 1948440}
	intercalary_years = calendar_types[calendar_type[0]]
	julian_days_before_hijra = calendar_types[calendar_type[1]]
	return intercalary_years, julian_days_before_hijra


def to_gregorian(y, m, d, calendar_type = "2c"):
	"""Convert to Gregorian date

	Param:
	y as int - year
	m as int - month [1..12]
	d as int - day of month [1..30]
	calendar_type = the type of calendar as described by van Gent here:
	http://www.staff.science.uu.nl/~gent0113/islam/islam_tabcal_variants.htm
	(note that instead of van Gent's Roman numerals, the function uses Arabic numerals)
	NB: The calendar type used by Wuestenfeld-Mahler seems to be 2c
	    The calendar type used by the MS [Microsoft] HijriCalendar is of the 2a type

	Return:
	int - year
	int - month [1..12]
	int - day of month [1..31]
	"""

	intercalary_years, julian_days_before_hijra = cal_types(calendar_type)

	month_matrix = make_month_len_matrix(intercalary_years)
	
	past_cycles = math.floor((y-1) / 30)
	#print("past_cycles", past_cycles)
	# every 30-year cycle has 10631 days
	days_of_past_cycles = past_cycles * ((30 * 354) + 11)
	#print("days_of_past_cycles", days_of_past_cycles)
	
	index = (y-(30*past_cycles)-1) * 12 + (m - 1)
	#print("index", index)
	days_of_present_cycle = sum(i + 29 for i in month_matrix[:index] if index > 0) + (d - 1)
	#print("days_of_present_cycle", days_of_present_cycle)

	
	jd = julian_days_before_hijra + days_of_past_cycles + days_of_present_cycle
	#jd = 1948439.5 + sum(i + 29 for i in _month_len[:index-1]) + d - 1
	return jd_to_gregorian(jd)


def make_month_len_matrix(intercalary_years):
    """prints a matrix of the months in the 30-year cycle that have
    29 (0) or 30 (1) days; to be used with the calculation of the """
    add_day = True
    year_extra_days = []
    for year in range(1, 31):
        for month in range(1, 13):
            extra = 0
            if add_day == True:
                
                add_day = False
                if month == 12:
                    if year in intercalary_years:
                        extra = 1
                    else:
                        extra = 0
                year_extra_days.append(1+extra)
            else:
                add_day = True
                if month == 12:
                    if year in intercalary_years:
                        extra = 1
                else:
                    extra = 0
                year_extra_days.append(0+extra)
    return year_extra_days


def print_month_len_matrix():
    """prints a matrix of the months in the 30-year cycle that have
    29 (0) or 30 (1) days"""
    add_day = True
    intercalary_years = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]
    for year in range(1, 31):
        
        year_extra_days = ""
        for month in range(1, 13):
            extra = 0
            if add_day == True:
                
                add_day = False
                if month == 12:
                    if year in intercalary_years:
                        extra = 1
                    else:
                        extra = 0
                year_extra_days += "{}, ".format(1+extra)
            else:
                add_day = True
                if month == 12:
                    if year in intercalary_years:
                        extra = 1
                else:
                    extra = 0
                year_extra_days += "{}, ".format(0+extra)
        print(year_extra_days)

## matrix based on the Type II intercalation
## (extra day at the end of years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26 & 29
## in every 30-year cycle
## cf. http://www.staff.science.uu.nl/~gent0113/islam/islam_tabcal_variants.htm
##_month_len = (1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,       # year 1
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 2
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 3
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 4
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 5
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 6
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 7
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 8
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 9
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 10
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 11
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 12
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 13
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 14
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 15
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 16
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 17
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 18
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 19
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 20
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 21
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 22
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 23
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 24
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 25
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 26
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 27
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,     # year 28
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,     # year 29
##                1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0)     # year 30



def first_and_last_day_of_hijri_year(year, calendar_type = "2c"):
        """return a tuple (hijri year, first day, last day)"""
        intercalary_years, julian_days_before_hijra = cal_types(calendar_type)
        first_day = to_gregorian(year, 1, 1)
        y, m, d = first_day
        #print(first_day)
        if year % 30 in intercalary_years:
            last_day = jd_to_gregorian(gregorian_to_jd(y, m, d)+354)
        else:
            last_day = jd_to_gregorian(gregorian_to_jd(y, m, d)+353)
        return(year, first_day, last_day)
        
def format_day(day, dateformat="dd-mm-yyyy"):
        y, m, d = day
        day_dict = {"y":y, "m":m, "d":d}
        len_dict = {}
        for x in ("y", "m", "d"):
                len_dict[x] = len(re.findall(x, dateformat))
        for x in ("y", "m", "d"):
                no_of_digits = len_dict[x]
                while len(str(day_dict[x])) < no_of_digits:
                        day_dict[x] = "0"+str(day_dict[x])

        formatted_day = re.sub("d+", str(day_dict["d"]), dateformat)
        formatted_day = re.sub("m+", str(day_dict["m"]), formatted_day)
        formatted_day = re.sub("y+", str(day_dict["y"]), formatted_day)
        
        return formatted_day
        


def first_and_last_day_of_hijri_years(first, last, calendar_type="2c", dateformat="dd/mm/yyyy"):
    """print a list of the first and last day of every hijri year"""
    intercalary_years, julian_days_before_hijra = cal_types(calendar_type)
    for year in range(first, last+1):
        first_day = to_gregorian(year, 1, 1, calendar_type)
        y, m, d = first_day
        #print(first_day)
        if year % 30 in intercalary_years:
            last_day = jd_to_gregorian(gregorian_to_jd(y, m, d)+354)
        else:
            last_day = jd_to_gregorian(gregorian_to_jd(y, m, d)+353)
##        print("{},Year {} AH,{}-{}-{},{}-{}-{}".format(year, year, first_day[0],first_day[1],first_day[2],
##                                            last_day[0], last_day[1], last_day[2]))
        print("{},Year {} AH,{},{}".format(year, year, format_day(first_day, dateformat),
              format_day(last_day, dateformat)))
    
    
if __name__ == "__main__":
        #print(to_gregorian(150, 12, 29))
        #first_and_last_day_of_hijri_years(1, 500, calendar_type="2c", dateformat="dd-mm-yyyy")
        #print(format_day((25,9,1), "dd/mm/yyyy"))
        #print(first_and_last_day_of_hijri_year(500))
        #print_month_len_matrix()
        ##intercalary_years = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]
        ##print(make_month_len_matrix(intercalary_years))

        print(to_gregorian(150, 12, 29))
        print("{}-{}-{}".format(*to_gregorian(120,1,1)))
