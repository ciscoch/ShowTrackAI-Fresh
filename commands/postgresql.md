TITLE: Defining Cape Verde Time (CVT)
DESCRIPTION: This snippet defines Cape Verde Time (CVT) by referencing the Atlantic/Cape_Verde timezone. It is marked as an obsolete timezone.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Atlantic.txt#_snippet_4

LANGUAGE: TZData Format
CODE:
```
CVT     Atlantic/Cape_Verde  # Cape Verde Time (obsolete)
```

----------------------------------------

TITLE: Defining Falkland Islands Time (FKT)
DESCRIPTION: This snippet defines Falkland Islands Time (FKT) by referencing the Atlantic/Stanley timezone. It is marked as an obsolete timezone.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Atlantic.txt#_snippet_6

LANGUAGE: TZData Format
CODE:
```
FKT     Atlantic/Stanley  # Falkland Islands Time (obsolete)
```

----------------------------------------

TITLE: Defining Azores Time (AZOT)
DESCRIPTION: This snippet defines Azores Time (AZOT) with an offset of -3600 seconds from UTC. It is marked as an obsolete timezone.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Atlantic.txt#_snippet_3

LANGUAGE: TZData Format
CODE:
```
AZOT    -3600    # Azores Time (obsolete)
```

----------------------------------------

TITLE: EAT Time Zone Definition
DESCRIPTION: Defines East Africa Time (EAT), specifying its standard UTC offset of 10800 seconds (3 hours) and listing the associated geographical regions in East Africa and the Indian Ocean.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Africa.txt#_snippet_3

LANGUAGE: Plain Text
CODE:
```
EAT     10800    # East Africa Time
                 #     (Africa/Addis_Ababa)
                 #     (Africa/Asmera)
                 #     (Africa/Dar_es_Salaam)
                 #     (Africa/Djibouti)
                 #     (Africa/Kampala)
                 #     (Africa/Khartoum)
                 #     (Africa/Mogadishu)
                 #     (Africa/Nairobi)
                 #     (Indian/Antananarivo)
                 #     (Indian/Comoro)
                 #     (Indian/Mayotte)
```

----------------------------------------

TITLE: CAT Time Zone Definition
DESCRIPTION: Defines Central Africa Time (CAT), specifying its standard UTC offset of 7200 seconds (2 hours) and listing the associated geographical regions in Africa.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Africa.txt#_snippet_0

LANGUAGE: Plain Text
CODE:
```
CAT      7200    # Central Africa Time
                 #     (Africa/Blantyre)
                 #     (Africa/Bujumbura)
                 #     (Africa/Gaborone)
                 #     (Africa/Harare)
                 #     (Africa/Kigali)
                 #     (Africa/Lubumbashi)
                 #     (Africa/Lusaka)
                 #     (Africa/Maputo)
```

----------------------------------------

TITLE: EEST Time Zone Definition
DESCRIPTION: Defines East-Egypt Summer Time (EEST) and Eastern Europe Summer Time, indicating its daylight saving offset of 10800 seconds (3 hours) from UTC and listing the associated regions in Eastern Europe, the Middle East, and North Africa.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Africa.txt#_snippet_4

LANGUAGE: Plain Text
CODE:
```
EEST    10800 D  # East-Egypt Summer Time
                 # Eastern Europe Summer Time
                 #     (Africa/Cairo)
                 #     (Asia/Amman)
                 #     (Asia/Beirut)
                 #     (Asia/Damascus)
                 #     (Asia/Gaza)
                 #     (Asia/Nicosia)
                 #     (Europe/Athens)
                 #     (Europe/Bucharest)
                 #     (Europe/Chisinau)
                 #     (Europe/Helsinki)
                 #     (Europe/Istanbul)
                 #     (Europe/Kaliningrad)
                 #     (Europe/Kiev)
                 #     (Europe/Minsk)
                 #     (Europe/Riga)
                 #     (Europe/Simferopol)
                 #     (Europe/Sofia)
                 #     (Europe/Tallinn)
                 #     (Europe/Uzhgorod)
                 #     (Europe/Vilnius)
                 #     (Europe/Zaporozhye)
```

----------------------------------------

TITLE: Defining ACST (Acre Summer Time) in PostgreSQL Timezone Config
DESCRIPTION: Defines 'ACST' (Acre Summer Time) with a daylight saving offset of -14400 seconds. This entry is obsolete and not in the IANA database. It is explicitly noted as a conflict due to the 'ACST' abbreviation also being used for Australian Central Standard Time.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/America.txt#_snippet_1

LANGUAGE: PostgreSQL Timezone Definition
CODE:
```
ACST   -14400 D  # Acre Summer Time (obsolete, not in IANA database)
```

----------------------------------------

TITLE: Defining AKST (Alaska Standard Time) in PostgreSQL Timezone Config
DESCRIPTION: Defines 'AKST' (Alaska Standard Time) with a standard offset of -32400 seconds. This timezone is applicable to locations such as America/Anchorage, America/Juneau, America/Nome, and America/Yakutat.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/America.txt#_snippet_4

LANGUAGE: PostgreSQL Timezone Definition
CODE:
```
AKST   -32400    # Alaska Standard Time
                 #     (America/Anchorage)
                 #     (America/Juneau)
                 #     (America/Nome)
                 #     (America/Yakutat)
```

----------------------------------------

TITLE: Defining ARST (Argentina Summer Time) in PostgreSQL Timezone Config
DESCRIPTION: Defines 'ARST' (Argentina Summer Time) by mapping it directly to the 'America/Argentina/Buenos_Aires' IANA timezone. This entry is marked as obsolete.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/America.txt#_snippet_8

LANGUAGE: PostgreSQL Timezone Definition
CODE:
```
ARST    America/Argentina/Buenos_Aires  # Argentina Summer Time (obsolete)
```

----------------------------------------

TITLE: Defining Australia Western Summer Standard Time (AWSST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'AWSST' for Australia Western Summer Standard Time, with a UTC offset of 32400 seconds (9 hours) and marked as Daylight Saving Time. It is noted as not being in the IANA database.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_7

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
AWSST   32400 D  # Australia Western Summer Standard Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Australian Central Summer Standard Time (ACSST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'ACSST' for Australian Central Summer Standard Time, with a UTC offset of 37800 seconds (10.5 hours) and marked as Daylight Saving Time. It is noted as not being in the IANA database.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_0

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
ACSST   37800 D  # Australian Central Summer Standard Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Australian Central Western Standard Time (ACWST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'ACWST' for Australian Central Western Standard Time, with a UTC offset of 31500 seconds (8.75 hours). This abbreviation is noted as obsolete.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_3

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
ACWST   31500    # Australian Central Western Standard Time (obsolete)
```

----------------------------------------

TITLE: Defining Australian Eastern Summer Standard Time (AESST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'AESST' for Australian Eastern Summer Standard Time, with a UTC offset of 39600 seconds (11 hours) and marked as Daylight Saving Time. It is noted as not being in the IANA database.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_4

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
AESST   39600 D  # Australian Eastern Summer Standard Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Central Standard Time (CST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'CST' for Central Standard Time, with a UTC offset of 34200 seconds (9.5 hours). It is noted as not being in the IANA database and has potential naming conflicts with other global 'CST' timezones.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_11

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
CST     34200    # Central Standard Time (not in IANA database)
```

----------------------------------------

TITLE: Defining West Australian Daylight-Saving Time (WADT) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'WADT' for West Australian Daylight-Saving Time, with a UTC offset of 28800 seconds (8 hours) and marked as Daylight Saving Time. It is noted as not being in the IANA database.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_22

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
WADT    28800 D  # West Australian Daylight-Saving Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Central Australia Daylight-Saving Time (CADT) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'CADT' for Central Australia Daylight-Saving Time, with a UTC offset of 37800 seconds (10.5 hours) and marked as Daylight Saving Time. It is noted as not being in the IANA database.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_9

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
CADT    37800 D  # Central Australia Daylight-Saving Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Australian Eastern Daylight Time (AEDT) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'AEDT' for Australian Eastern Daylight Time, with a UTC offset of 39600 seconds (11 hours) and marked as Daylight Saving Time. It is associated with various eastern Australian regions.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_5

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
AEDT    39600 D  # Australian Eastern Daylight Time\n                 #     (Australia/Brisbane)\n                 #     (Australia/Currie)\n                 #     (Australia/Hobart)\n                 #     (Australia/Lindeman)\n                 #     (Australia/Melbourne)\n                 #     (Australia/Sydney)
```

----------------------------------------

TITLE: Defining Eastern Standard Time (EST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'EST' for Eastern Standard Time, with a UTC offset of 36000 seconds (10 hours). It is noted as not being in the IANA database and has potential naming conflicts with other global 'EST' timezones.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_14

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
EST     36000    # Eastern Standard Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Lord Howe Daylight Time (LHDT) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'LHDT' for Lord Howe Daylight Time, referencing the 'Australia/Lord_Howe' region name instead of a direct offset. This abbreviation is noted as obsolete.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_15

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
LHDT    Australia/Lord_Howe  # Lord Howe Daylight Time (obsolete)
```

----------------------------------------

TITLE: Defining South Australian Standard Time (SAT) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'SAT' for South Australian Standard Time, with a UTC offset of 34200 seconds (9.5 hours). It is noted as not being in the IANA database.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_21

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
SAT     34200    # South Australian Standard Time (not in IANA database)
```

----------------------------------------

TITLE: Defining Australian Western Standard Time (AWST) in PostgreSQL Timezone Config
DESCRIPTION: This entry defines 'AWST' for Australian Western Standard Time, with a UTC offset of 28800 seconds (8 hours). It is associated with the Australia/Perth region.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Australia.txt#_snippet_8

LANGUAGE: PostgreSQL Timezone Config
CODE:
```
AWST    28800    # Australian Western Standard Time\n                 #     (Australia/Perth)
```

----------------------------------------

TITLE: Defining IST Time Zone Abbreviation (Configuration)
DESCRIPTION: Defines 'Irish Standard Time' (IST) with an offset of 3600 seconds (1 hour) from UTC. Note that 'IST' is a conflicting abbreviation also used for Indian Standard Time and Israel Standard Time. This specific definition is for Europe/Dublin.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Europe.txt#_snippet_2

LANGUAGE: Configuration
CODE:
```
IST      3600    # Irish Standard Time
```

----------------------------------------

TITLE: Defining WET Time Zone Abbreviation (Configuration)
DESCRIPTION: Defines 'Western Europe Time' (WET) with a UTC offset of 0 seconds. This time zone is used by regions such as Africa/Casablanca, Africa/El_Aaiun, Atlantic/Canary, Atlantic/Faeroe, Atlantic/Madeira, and Europe/Lisbon.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Europe.txt#_snippet_14

LANGUAGE: Configuration
CODE:
```

```

----------------------------------------

TITLE: Defining MEZ Time Zone Abbreviation (Configuration)
DESCRIPTION: Defines 'Mitteleuropaeische Zeit' (MEZ), the German term for Middle European Time, with an offset of 3600 seconds (1 hour) from UTC. This abbreviation is attested in IANA comments.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Europe.txt#_snippet_7

LANGUAGE: Configuration
CODE:
```
MEZ      3600    # Mitteleuropaeische Zeit (German)
```

----------------------------------------

TITLE: Defining MET Time Zone Abbreviation (Configuration)
DESCRIPTION: Defines 'Middle Europe Time' (MET) with an offset of 3600 seconds (1 hour) from UTC. This abbreviation is marked as obsolete.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Europe.txt#_snippet_5

LANGUAGE: Configuration
CODE:
```
MET      3600    # Middle Europe Time (obsolete)
```

----------------------------------------

TITLE: Defining MSK Time Zone Abbreviation (Configuration)
DESCRIPTION: Defines 'Moscow Time' (MSK) by referencing the 'Europe/Moscow' time zone. This time zone is also associated with Europe/Volgograd.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Europe.txt#_snippet_9

LANGUAGE: Configuration
CODE:
```
MSK     Europe/Moscow  # Moscow Time
```

----------------------------------------

TITLE: Time Zone Abbreviations and Mappings
DESCRIPTION: This snippet provides a mapping of common time zone abbreviations to their UTC offsets in seconds or to their corresponding IANA time zone database names. It includes notes on obsolete entries, daylight saving indicators ('D'), and identified conflicts where an abbreviation maps to multiple time zones. This data is typically used for time zone resolution and display in applications.
SOURCE: https://github.com/postgres/postgres/blob/master/src/timezone/tznames/Asia.txt#_snippet_1

LANGUAGE: Timezone Definition
CODE:
```
# - GST: South Georgia Time (Atlantic)
GST     14400    # Gulf Standard Time (obsolete)
HKT     28800    # Hong Kong Time
                 #     (Asia/Hong_Kong)
HOVST   28800 D  # Hovd Summer Time (obsolete)
HOVT    Asia/Hovd  # Hovd Time (obsolete)
ICT     25200    # Indochina Time (obsolete)
IDT     10800 D  # Israel Daylight Time
                 #     (Asia/Jerusalem)
IRDT    Asia/Tehran  # Iran Daylight Time (obsolete)
IRKST   Asia/Irkutsk  # Irkutsk Summer Time (obsolete)
IRKT    Asia/Irkutsk  # Irkutsk Time (obsolete)
IRST    Asia/Tehran  # Iran Standard Time (obsolete)
IRT     12600    # Iran Time (not in IANA database)
# CONFLICT! IST is not unique
# Other timezones:
# - IST: Irish Standard Time (Europe)
# - IST: Israel Standard Time (Asia)
IST     19800    # Indian Standard Time
                 #     (Asia/Calcutta)
# CONFLICT! IST is not unique
# Other timezones:
# - IST: Irish Standard Time (Europe)
# - IST: Indian Standard Time (Asia)
IST      7200    # Israel Standard Time
                 #     (Asia/Jerusalem)
JAYT    32400    # Jayapura Time (Indonesia) (not in IANA database)
JST     32400    # Japan Standard Time
                 #     (Asia/Tokyo)
KDT     36000 D  # Korean Daylight Time (not in IANA database)
KGST    21600 D  # Kyrgyzstan Summer Time (obsolete)
KGT     Asia/Bishkek  # Kyrgyzstan Time (obsolete)
KRAST   Asia/Krasnoyarsk  # Krasnoyarsk Summer Time (obsolete)
KRAT    Asia/Krasnoyarsk  # Krasnoyarsk Time (obsolete)
KST     Asia/Pyongyang    # Korean Standard Time
                 #     (Asia/Pyongyang)
KST     32400    # Korean Standard Time
                 #     (Asia/Seoul)
LKT     Asia/Colombo  # Lanka Time (obsolete)
MAGST   Asia/Magadan  # Magadan Summer Time (obsolete)
MAGT    Asia/Magadan  # Magadan Time (obsolete)
MMT     23400    # Myanmar Time (obsolete)
MYT     28800    # Malaysia Time (obsolete)
NOVST   Asia/Novosibirsk  # Novosibirsk Summer Time (obsolete)
NOVT    Asia/Novosibirsk  # Novosibirsk Time (obsolete)
NPT     20700    # Nepal Time (obsolete)
OMSST   Asia/Omsk  # Omsk Summer Time (obsolete)
OMST    Asia/Omsk  # Omsk Time (obsolete)
ORAT    Asia/Oral  # Oral Time (obsolete)
PETST   Asia/Kamchatka  # Petropavlovsk-Kamchatski Summer Time (obsolete)
PETT    Asia/Kamchatka  # Petropavlovsk-Kamchatski Time (obsolete)
PHT     28800    # Philippine Time (obsolete)
PKT     18000    # Pakistan Time
                 #     (Asia/Karachi)
PKST    21600 D  # Pakistan Summer Time
                 #     (Asia/Karachi)
# CONFLICT! PST is not unique
# Other timezones:
#  - PST: Pacific Standard Time (America)
PST     28800    # Philippine Standard Time
QYZT    21600    # Kizilorda Time (obsolete)
SAKST   Asia/Sakhalin  # Sakhalin Summer Time (obsolete)
SAKT    Asia/Sakhalin  # Sakhalin Time (obsolete)
SGT     Asia/Singapore  # Singapore Time (obsolete)
SRET    39600    # Srednekolymsk Time (obsolete)
TJT     18000    # Tajikistan Time (obsolete)
TLT     32400    # East Timor Time (obsolete)
TMT     Asia/Ashgabat  # Turkmenistan Time (obsolete)
ULAST   32400 D  # Ulan Bator Summer Time (obsolete)
ULAT    Asia/Ulaanbaatar  # Ulan Bator Time (obsolete)
UZST    21600 D  # Uzbekistan Summer Time (obsolete)
UZT     18000    # Uzbekistan Time (obsolete)
VLAST   Asia/Vladivostok  # Vladivostok Summer Time (obsolete)
VLAT    Asia/Vladivostok  # Vladivostok Time (obsolete)
WIB     25200    # Waktu Indonesia Barat
                 #     (Asia/Jakarta)
                 #     (Asia/Pontianak)
WIT     32400    # Waktu Indonesia Timur (caution: this used to mean 25200)
                 #     (Asia/Jayapura)
WITA    28800    # Waktu Indonesia Tengah
                 #     (Asia/Makassar)
XJT     21600    # Xinjiang Time (obsolete)
YAKST   Asia/Yakutsk  # Yakutsk Summer Time (obsolete)
YAKT    Asia/Yakutsk  # Yakutsk Time (obsolete)
YEKST   21600 D  # Yekaterinburg Summer Time (obsolete)
YEKT    Asia/Yekaterinburg  # Yekaterinburg Time (obsolete)
```

----------------------------------------

TITLE: Listing Important Targets (PostgreSQL Meson)
DESCRIPTION: This target displays a list of important Meson targets for the PostgreSQL project. It serves as a quick reference for available build and utility commands.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_25

LANGUAGE: Meson Build System
CODE:
```
help
```

----------------------------------------

TITLE: Building PostgreSQL Contrib Modules (Meson)
DESCRIPTION: This target builds the optional contrib modules provided with PostgreSQL. These modules offer extended functionality and tools that are not part of the core server.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_3

LANGUAGE: Meson Build System
CODE:
```
contrib
```

----------------------------------------

TITLE: Installing Man Page Documentation (PostgreSQL Meson)
DESCRIPTION: This target installs the PostgreSQL documentation specifically in man page format. This is useful for providing command-line help for installed utilities.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_18

LANGUAGE: Meson Build System
CODE:
```
install-man
```

----------------------------------------

TITLE: Installing PostgreSQL (Meson)
DESCRIPTION: This target installs the compiled PostgreSQL components, excluding documentation. It's the primary command for deploying the database system.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_15

LANGUAGE: Meson Build System
CODE:
```
install
```

----------------------------------------

TITLE: Updating Unicode Data (PostgreSQL Meson)
DESCRIPTION: This developer target updates the Unicode data used by PostgreSQL to a newer version. It ensures that character set handling and collation rules are up-to-date.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_7

LANGUAGE: Meson Build System
CODE:
```
update-unicode
```

----------------------------------------

TITLE: Installing HTML and Man Page Documentation (PostgreSQL Meson)
DESCRIPTION: This target installs the PostgreSQL documentation in both multi-page HTML and man page formats. It's used to deploy the documentation alongside the installed binaries.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_16

LANGUAGE: Meson Build System
CODE:
```
install-docs
```

----------------------------------------

TITLE: Installing Multi-page HTML Documentation (PostgreSQL Meson)
DESCRIPTION: This target installs the PostgreSQL documentation specifically in multi-page HTML format. It's useful when only the web-based documentation is required.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_17

LANGUAGE: Meson Build System
CODE:
```
install-html
```

----------------------------------------

TITLE: Building PostgreSQL Procedural Languages (Meson)
DESCRIPTION: This target compiles the various procedural languages supported by PostgreSQL, such as PL/pgSQL, PL/Python, etc. These languages allow users to write server-side functions and triggers.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_4

LANGUAGE: Meson Build System
CODE:
```
pl
```

----------------------------------------

TITLE: Building PostgreSQL Backend (Meson)
DESCRIPTION: This target specifically builds the PostgreSQL backend and its directly related modules. It's useful for focused development or testing of the server core.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_1

LANGUAGE: Meson Build System
CODE:
```
backend
```

----------------------------------------

TITLE: Building Single-page HTML Documentation (PostgreSQL Meson)
DESCRIPTION: This target compiles the PostgreSQL documentation into a single-page HTML format. This can be useful for searching the entire documentation on one page or for specific offline viewing scenarios.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_13

LANGUAGE: Meson Build System
CODE:
```
doc/src/sgml/postgres.html
```

----------------------------------------

TITLE: Building Everything Including Documentation (PostgreSQL Meson)
DESCRIPTION: This target builds everything in the PostgreSQL project, including all core components and documentation. It's a comprehensive build option for a complete development environment.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_24

LANGUAGE: Meson Build System
CODE:
```
world
```

----------------------------------------

TITLE: Building US Letter PDF Documentation (PostgreSQL Meson)
DESCRIPTION: This target generates the PostgreSQL documentation as a PDF file formatted for US letter paper size. It's suitable for printing or offline reading in regions using this standard.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_12

LANGUAGE: Meson Build System
CODE:
```
doc/src/sgml/postgres-US.pdf
```

----------------------------------------

TITLE: Building All Documentation Formats (PostgreSQL Meson)
DESCRIPTION: This target builds the PostgreSQL documentation in all supported formats. It's a comprehensive option for generating all available documentation outputs.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_14

LANGUAGE: Meson Build System
CODE:
```
alldocs
```

----------------------------------------

TITLE: Configuring External Library Support in Meson
DESCRIPTION: This snippet defines various build options for enabling or disabling support for external libraries and features within the PostgreSQL project. Each 'option' call specifies a feature name, its type (e.g., 'feature', 'combo', 'boolean'), a default value, and a descriptive explanation. These options control the inclusion of functionalities like SSL, XML, ICU, DTrace, and different documentation formats.
SOURCE: https://github.com/postgres/postgres/blob/master/meson_options.txt#_snippet_5

LANGUAGE: Meson Build System
CODE:
```
option('bonjour', type: 'feature', value: 'auto',
  description: 'Bonjour support')

option('bsd_auth', type: 'feature', value: 'auto',
  description: 'BSD Authentication support')

option('docs', type: 'feature', value: 'auto',
  description: 'Documentation in HTML and man page format')

option('docs_pdf', type: 'feature', value: 'auto',
  description: 'Documentation in PDF format')

option('docs_html_style', type: 'combo', choices: ['simple', 'website'],
  description: 'CSS stylesheet for HTML documentation')

option('dtrace', type: 'feature', value: 'disabled',
  description: 'DTrace support')

option('gssapi', type: 'feature', value: 'auto',
  description: 'GSSAPI support')

option('icu', type: 'feature', value: 'auto',
  description: 'ICU support')

option('ldap', type: 'feature', value: 'auto',
  description: 'LDAP support')

option('libcurl', type : 'feature', value: 'auto',
  description: 'libcurl support')

option('libedit_preferred', type: 'boolean', value: false,
  description: 'Prefer BSD Libedit over GNU Readline')

option('libnuma', type: 'feature', value: 'auto',
  description: 'NUMA support')

option('liburing', type : 'feature', value: 'auto',
  description: 'io_uring support, for asynchronous I/O')

option('libxml', type: 'feature', value: 'auto',
  description: 'XML support')

option('libxslt', type: 'feature', value: 'auto',
  description: 'XSLT support in contrib/xml2')

option('llvm', type: 'feature', value: 'disabled',
  description: 'LLVM support')

option('lz4', type: 'feature', value: 'auto',
  description: 'LZ4 support')

option('nls', type: 'feature', value: 'auto',
  description: 'Native language support')

option('pam', type: 'feature', value: 'auto',
  description: 'PAM support')

option('plperl', type: 'feature', value: 'auto',
  description: 'Build Perl modules (PL/Perl)')

option('plpython', type: 'feature', value: 'auto',
  description: 'Build Python modules (PL/Python)')

option('pltcl', type: 'feature', value: 'auto',
  description: 'Build with Tcl support (PL/Tcl)')

option('tcl_version', type: 'string', value: 'tcl',
  description: 'Tcl version')

option('readline', type: 'feature', value: 'auto',
  description: 'Use GNU Readline or BSD Libedit for editing')

option('selinux', type: 'feature', value: 'auto',
  description: 'SELinux support')

option('ssl', type: 'combo', choices: ['auto', 'none', 'openssl'],
  value: 'auto',
  description: 'Use LIB for SSL/TLS support (openssl)')

option('systemd', type: 'feature', value: 'auto',
  description: 'systemd support')

option('uuid', type: 'combo', choices: ['none', 'bsd', 'e2fs', 'ossp'],
  value: 'none',
  description: 'Use LIB for contrib/uuid-ossp support')

option('zlib', type: 'feature', value: 'auto',
  description: 'Enable zlib')

option('zstd', type: 'feature', value: 'auto',
  description: 'Enable zstd')
```

----------------------------------------

TITLE: Defining Developer-Specific Options in PostgreSQL Build System
DESCRIPTION: These options enable various features primarily for PostgreSQL developers and testers, such as assertion checks for debugging, TAP tests, injection points, and extra test selection. They facilitate development, debugging, and quality assurance processes.
SOURCE: https://github.com/postgres/postgres/blob/master/meson_options.txt#_snippet_3

LANGUAGE: Build System Configuration
CODE:
```
option('cassert', type: 'boolean', value: false,
  description: 'Enable assertion checks (for debugging)')

option('tap_tests', type: 'feature', value: 'auto',
  description: 'Enable TAP tests')

option('injection_points', type: 'boolean', value: false,
  description: 'Enable injection points')

option('PG_TEST_EXTRA', type: 'string', value: '',
  description: 'Enable selected extra tests. Overridden by PG_TEST_EXTRA environment variable.')

option('PG_GIT_REVISION', type: 'string', value: 'HEAD',
  description: 'git revision to be packaged by pgdist target')
```

----------------------------------------

TITLE: Defining External Program Paths in Meson
DESCRIPTION: This snippet configures the paths to various external programs and binaries required by the PostgreSQL build process. Each 'option' call specifies the program's identifier (e.g., 'BISON', 'PYTHON'), its type (e.g., 'string', 'array'), a default value (which can be a single path or a list of preferred paths), and a description. These options ensure the build system can locate necessary tools like compilers, archivers, and scripting language interpreters.
SOURCE: https://github.com/postgres/postgres/blob/master/meson_options.txt#_snippet_6

LANGUAGE: Meson Build System
CODE:
```
option('BISON', type: 'array', value: ['bison', 'win_bison'],
  description: 'Path to bison binary')

option('DTRACE', type: 'string', value: 'dtrace',
  description: 'Path to dtrace binary')

option('FLEX', type: 'array', value: ['flex', 'win_flex'],
  description: 'Path to flex binary')

option('FOP', type: 'string', value: 'fop',
  description: 'Path to fop binary')

option('GZIP', type: 'string', value: 'gzip',
  description: 'Path to gzip binary')

option('LZ4', type: 'string', value: 'lz4',
  description: 'Path to lz4 binary')

option('OPENSSL', type: 'string', value: 'openssl',
  description: 'Path to openssl binary')

option('PERL', type: 'string', value: 'perl',
  description: 'Path to perl binary')

option('PROVE', type: 'string', value: 'prove',
  description: 'Path to prove binary')

option('PYTHON', type: 'array', value: ['python3', 'python'],
  description: 'Path to python binary')

option('SED', type: 'string', value: 'gsed',
  description: 'Path to sed binary')

option('STRIP', type: 'string', value: 'strip',
  description: 'Path to strip binary, used for PGXS emulation')

option('TAR', type: 'string', value: 'tar',
  description: 'Path to tar binary')

option('XMLLINT', type: 'string', value: 'xmllint',
  description: 'Path to xmllint binary')

option('XSLTPROC', type: 'string', value: 'xsltproc',
  description: 'Path to xsltproc binary')

option('ZSTD', type: 'string', value: 'zstd',
  description: 'Path to zstd binary')

option('ZIC', type: 'string', value: 'zic',
  description: 'Path to zic binary, when cross-compiling')
```

----------------------------------------

TITLE: List of libpq DLL Exported Functions
DESCRIPTION: This section enumerates all functions made available by the libpq dynamic-link libraries. These functions are essential for applications to establish connections, send queries, retrieve results, and manage various aspects of PostgreSQL database interaction.
SOURCE: https://github.com/postgres/postgres/blob/master/src/interfaces/libpq/exports.txt#_snippet_0

LANGUAGE: APIDOC
CODE:
```
PQconnectdb               1
PQsetdbLogin              2
PQconndefaults            3
PQfinish                  4
PQreset                   5
PQrequestCancel           6
PQdb                      7
PQuser                    8
PQpass                    9
PQhost                    10
PQport                    11
PQtty                     12
PQoptions                 13
PQstatus                  14
PQerrorMessage            15
PQsocket                  16
PQbackendPID              17
PQtrace                   18
PQuntrace                 19
PQsetNoticeProcessor      20
PQexec                    21
PQnotifies                22
PQsendQuery               23
PQgetResult               24
PQisBusy                  25
PQconsumeInput            26
PQgetline                 27
PQputline                 28
PQgetlineAsync            29
PQputnbytes               30
PQendcopy                 31
PQfn                      32
PQresultStatus            33
PQntuples                 34
PQnfields                 35
PQbinaryTuples            36
PQfname                   37
PQfnumber                 38
PQftype                   39
PQfsize                   40
PQfmod                    41
PQcmdStatus               42
PQoidStatus               43
PQcmdTuples               44
PQgetvalue                45
PQgetlength               46
PQgetisnull               47
PQclear                   48
PQmakeEmptyPGresult       49
PQprint                   50
PQdisplayTuples           51
PQprintTuples             52
lo_open                   53
lo_close                  54
lo_read                   55
lo_write                  56
lo_lseek                  57
lo_creat                  58
lo_tell                   59
lo_unlink                 60
lo_import                 61
lo_export                 62
pgresStatus               63
PQmblen                   64
PQresultErrorMessage      65
PQresStatus               66
termPQExpBuffer           67
appendPQExpBufferChar     68
initPQExpBuffer           69
resetPQExpBuffer          70
PQoidValue                71
PQclientEncoding          72
PQenv2encoding            73
appendBinaryPQExpBuffer   74
appendPQExpBufferStr      75
destroyPQExpBuffer        76
createPQExpBuffer         77
PQconninfoFree            78
PQconnectPoll             79
PQconnectStart            80
PQflush                   81
PQisnonblocking           82
PQresetPoll               83
PQresetStart              84
PQsetClientEncoding       85
PQsetnonblocking          86
PQfreeNotify              87
PQescapeString            88
PQescapeBytea             89
printfPQExpBuffer         90
appendPQExpBuffer         91
pg_encoding_to_char       92
pg_utf_mblen              93
PQunescapeBytea           94
PQfreemem                 95
PQtransactionStatus       96
PQparameterStatus         97
PQprotocolVersion         98
PQsetErrorVerbosity       99
PQsetNoticeReceiver       100
PQexecParams              101
PQsendQueryParams         102
PQputCopyData             103
PQputCopyEnd              104
PQgetCopyData             105
PQresultErrorField        106
PQftable                  107
PQftablecol               108
PQfformat                 109
PQexecPrepared            110
PQsendQueryPrepared       111
PQdsplen                  112
PQserverVersion           113
PQgetssl                  114
pg_char_to_encoding       115
pg_valid_server_encoding  116
pqsignal                  117
PQprepare                 118
PQsendPrepare             119
PQgetCancel               120
PQfreeCancel              121
PQcancel                  122
lo_create                 123
PQinitSSL                 124
PQregisterThreadLock      125
PQescapeStringConn        126
PQescapeByteaConn         127
PQencryptPassword         128
PQisthreadsafe            129
enlargePQExpBuffer        130
PQnparams                 131
PQparamtype               132
PQdescribePrepared        133
PQdescribePortal          134
PQsendDescribePrepared    135
PQsendDescribePortal      136
lo_truncate               137
PQconnectionUsedPassword  138
pg_valid_server_encoding_id 139
PQconnectionNeedsPassword 140
lo_import_with_oid        141
PQcopyResult              142
PQsetResultAttrs          143
PQsetvalue                144
PQresultAlloc             145
PQregisterEventProc       146
PQinstanceData            147
PQsetInstanceData         148
PQresultInstanceData      149
PQresultSetInstanceData   150
PQfireResultCreateEvents  151
PQconninfoParse           152
PQinitOpenSSL             153
PQescapeLiteral           154
PQescapeIdentifier        155
PQconnectdbParams         156
PQconnectStartParams      157
PQping                    158
PQpingParams              159
PQlibVersion              160
PQsetSingleRowMode        161
lo_lseek64                162
lo_tell64                 163
lo_truncate64             164
PQconninfo                165
PQsslInUse                166
PQsslStruct               167
PQsslAttributeNames       168
```

----------------------------------------

TITLE: SQL Feature F051.05: Explicit CAST for Datetime and Character String Types
DESCRIPTION: Documents PostgreSQL's support for explicit CAST operations between datetime types and character string types.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_10

LANGUAGE: APIDOC
CODE:
```
Feature ID: F051.05
Category: Basic date and time
Description: Explicit CAST between datetime types and character string types
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F261: CASE Expression
DESCRIPTION: Documents PostgreSQL's general support for the CASE expression.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_43

LANGUAGE: APIDOC
CODE:
```
Feature ID: F261
Category: CASE expression
Description: CASE expression
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F124: SET TRANSACTION Statement: DIAGNOSTICS SIZE Clause
DESCRIPTION: Documents PostgreSQL's support for the DIAGNOSTICS SIZE clause in the SET TRANSACTION statement.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_26

LANGUAGE: APIDOC
CODE:
```
Feature ID: F124
Category: SET TRANSACTION statement: DIAGNOSTICS SIZE clause
Description: SET TRANSACTION statement: DIAGNOSTICS SIZE clause
PostgreSQL Support: NO
```

----------------------------------------

TITLE: SQL Feature F123: All Diagnostics
DESCRIPTION: Documents PostgreSQL's support for all diagnostics features.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_25

LANGUAGE: APIDOC
CODE:
```
Feature ID: F123
Category: All diagnostics
Description: All diagnostics
PostgreSQL Support: NO
```

----------------------------------------

TITLE: SQL Feature F122: Enhanced Diagnostics Management
DESCRIPTION: Documents PostgreSQL's support for enhanced diagnostics management.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_24

LANGUAGE: APIDOC
CODE:
```
Feature ID: F122
Category: Enhanced diagnostics management
Description: Enhanced diagnostics management
PostgreSQL Support: NO
```

----------------------------------------

TITLE: SQL Feature F121: Basic Diagnostics Management
DESCRIPTION: Documents PostgreSQL's support for basic diagnostics management.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_23

LANGUAGE: APIDOC
CODE:
```
Feature ID: F121
Category: Basic diagnostics management
Description: Basic diagnostics management
PostgreSQL Support: NO
```

----------------------------------------

TITLE: SQL Feature F112: Isolation Level READ UNCOMMITTED
DESCRIPTION: Documents PostgreSQL's support for the READ UNCOMMITTED isolation level.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_19

LANGUAGE: APIDOC
CODE:
```
Feature ID: F112
Category: Isolation level READ UNCOMMITTED
Description: Isolation level READ UNCOMMITTED
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F113: Isolation Level READ COMMITTED
DESCRIPTION: Documents PostgreSQL's support for the READ COMMITTED isolation level.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_20

LANGUAGE: APIDOC
CODE:
```
Feature ID: F113
Category: Isolation level READ COMMITTED
Description: Isolation level READ COMMITTED
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F114: Isolation Level REPEATABLE READ
DESCRIPTION: Documents PostgreSQL's support for the REPEATABLE READ isolation level.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_21

LANGUAGE: APIDOC
CODE:
```
Feature ID: F114
Category: Isolation level REPEATABLE READ
Description: Isolation level REPEATABLE READ
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F051.03: TIMESTAMP Data Type Support
DESCRIPTION: Documents PostgreSQL's support for the SQL standard's TIMESTAMP data type, including TIMESTAMP literals and fractional seconds precision of at least 0 and 6.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_8

LANGUAGE: APIDOC
CODE:
```
Feature ID: F051.03
Category: Basic date and time
Description: TIMESTAMP data type (including support of TIMESTAMP literal) with fractional seconds precision of at least 0 and 6
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F051.08: LOCALTIMESTAMP Function
DESCRIPTION: Documents PostgreSQL's support for the SQL standard's LOCALTIMESTAMP function.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_13

LANGUAGE: APIDOC
CODE:
```
Feature ID: F051.08
Category: Basic date and time
Description: LOCALTIMESTAMP
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F261.01: Simple CASE
DESCRIPTION: Documents PostgreSQL's support for the simple CASE expression.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_44

LANGUAGE: APIDOC
CODE:
```
Feature ID: F261.01
Category: CASE expression
Description: Simple CASE
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F261.02: Searched CASE
DESCRIPTION: Documents PostgreSQL's support for the searched CASE expression.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_45

LANGUAGE: APIDOC
CODE:
```
Feature ID: F261.02
Category: CASE expression
Description: Searched CASE
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F261.03: NULLIF Function
DESCRIPTION: Documents PostgreSQL's support for the NULLIF function.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_46

LANGUAGE: APIDOC
CODE:
```
Feature ID: F261.03
Category: CASE expression
Description: NULLIF
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F262: Extended CASE Expression
DESCRIPTION: Documents PostgreSQL's support for extended CASE expressions.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_48

LANGUAGE: APIDOC
CODE:
```
Feature ID: F262
Category: Extended CASE expression
Description: Extended CASE expression
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F051.04: Comparison Predicate on Datetime Types
DESCRIPTION: Documents PostgreSQL's support for comparison predicates on DATE, TIME, and TIMESTAMP data types as per the SQL standard.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_9

LANGUAGE: APIDOC
CODE:
```
Feature ID: F051.04
Category: Basic date and time
Description: Comparison predicate on DATE, TIME, and TIMESTAMP data types
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F053: OVERLAPS Predicate
DESCRIPTION: Documents PostgreSQL's support for the SQL standard's OVERLAPS predicate.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_15

LANGUAGE: APIDOC
CODE:
```
Feature ID: F053
Category: OVERLAPS predicate
Description: OVERLAPS predicate
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F200: TRUNCATE TABLE Statement
DESCRIPTION: Documents PostgreSQL's support for the TRUNCATE TABLE statement.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_36

LANGUAGE: APIDOC
CODE:
```
Feature ID: F200
Category: TRUNCATE TABLE statement
Description: TRUNCATE TABLE statement
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F201: CAST Function
DESCRIPTION: Documents PostgreSQL's support for the CAST function.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_37

LANGUAGE: APIDOC
CODE:
```
Feature ID: F201
Category: CAST function
Description: CAST function
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F202: TRUNCATE TABLE: Identity Column Restart Option
DESCRIPTION: Documents PostgreSQL's support for the identity column restart option with the TRUNCATE TABLE statement.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_38

LANGUAGE: APIDOC
CODE:
```
Feature ID: F202
Category: TRUNCATE TABLE: identity column restart option
Description: TRUNCATE TABLE: identity column restart option
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F221: Explicit Defaults
DESCRIPTION: Documents PostgreSQL's support for explicit defaults.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_39

LANGUAGE: APIDOC
CODE:
```
Feature ID: F221
Category: Explicit defaults
Description: Explicit defaults
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F222: INSERT Statement: DEFAULT VALUES Clause
DESCRIPTION: Documents PostgreSQL's support for the DEFAULT VALUES clause in the INSERT statement.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_40

LANGUAGE: APIDOC
CODE:
```
Feature ID: F222
Category: INSERT statement: DEFAULT VALUES clause
Description: INSERT statement: DEFAULT VALUES clause
PostgreSQL Support: YES
```

----------------------------------------

TITLE: Building Multi-page HTML Documentation (PostgreSQL Meson)
DESCRIPTION: This target compiles the PostgreSQL documentation into a multi-page HTML format. This is the standard web-based documentation for browsing.
SOURCE: https://github.com/postgres/postgres/blob/master/doc/src/sgml/targets-meson.txt#_snippet_8

LANGUAGE: Meson Build System
CODE:
```
html
```

----------------------------------------

TITLE: SQL Feature F181: Multiple Module Support
DESCRIPTION: Documents PostgreSQL's support for multiple modules.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_34

LANGUAGE: APIDOC
CODE:
```
Feature ID: F181
Category: Multiple module support
Description: Multiple module support
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F131.02: Multiple Tables with Grouped Views
DESCRIPTION: Documents PostgreSQL's support for multiple tables in queries involving grouped views.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_29

LANGUAGE: APIDOC
CODE:
```
Feature ID: F131.02
Category: Grouped operations
Description: Multiple tables supported in queries with grouped views
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F261.04: COALESCE Function
DESCRIPTION: Documents PostgreSQL's support for the COALESCE function.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_47

LANGUAGE: APIDOC
CODE:
```
Feature ID: F261.04
Category: CASE expression
Description: COALESCE
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F131.04: Subqueries with GROUP BY and HAVING Clauses and Grouped Views
DESCRIPTION: Documents PostgreSQL's support for subqueries with GROUP BY and HAVING clauses in conjunction with grouped views.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_31

LANGUAGE: APIDOC
CODE:
```
Feature ID: F131.04
Category: Grouped operations
Description: Subqueries with GROUP BY and HAVING clauses and grouped views
PostgreSQL Support: YES
```

----------------------------------------

TITLE: SQL Feature F131.01: WHERE, GROUP BY, and HAVING Clauses with Grouped Views
DESCRIPTION: Documents PostgreSQL's support for WHERE, GROUP BY, and HAVING clauses in queries involving grouped views.
SOURCE: https://github.com/postgres/postgres/blob/master/src/backend/catalog/sql_features.txt#_snippet_28

LANGUAGE: APIDOC
CODE:
```
Feature ID: F131.01
Category: Grouped operations
Description: WHERE, GROUP BY, and HAVING clauses supported in queries with grouped views
PostgreSQL Support: YES
```
