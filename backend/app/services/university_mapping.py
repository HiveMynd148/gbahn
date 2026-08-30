import re
import unicodedata
from typing import Tuple, Optional

# Master dictionary mapping normalized or canonical university names to their geodata
# Format: "Canonical University Name": ("City/Location", "Federal State", "Institution Type")
# Institution Types: UNI (University), TU (Technical University), FH (University of Applied Sciences)
UNIVERSITY_DATA = {
    "Albstadt-Sigmaringen University": ("Albstadt / Sigmaringen", "Baden-Württemberg", "University of Applied Sciences"),
    "Ansbach University of Applied Sciences": ("Ansbach", "Bavaria", "University of Applied Sciences"),
    "Augsburg University of Applied Sciences": ("Augsburg", "Bavaria", "University of Applied Sciences"),
    "Bamberg University": ("Bamberg", "Bavaria", "University"),
    "Bauhaus-Universität Weimar": ("Weimar", "Thuringia", "University"),
    "Berlin School of Applied Sciences (HTW)": ("Berlin", "Berlin", "University of Applied Sciences"),
    "Berlin School of Economics and Law": ("Berlin", "Berlin", "University of Applied Sciences"),
    "Berlin University of Applied Sciences": ("Berlin", "Berlin", "University of Applied Sciences"),
    "Berlin University of Technology": ("Berlin", "Berlin", "Technical University"),
    "Bielefeld University": ("Bielefeld", "North Rhine-Westphalia", "University"),
    "Bielefeld University of Applied Sciences and Arts (HSBI)": ("Bielefeld", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Bonn-Rhine-Sieg University of Applied Sciences": ("Sankt Augustin", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Brandenburgische Technische Universität Cottbus-Senftenberg": ("Cottbus / Senftenberg", "Brandenburg", "Technical University"),
    "Catholic University in Eichstätt - Ingolstadt": ("Eichstätt / Ingolstadt", "Bavaria", "University"),
    "Chemnitz University of Technology": ("Chemnitz", "Saxony", "Technical University"),
    "Constructor University": ("Bremen", "Bremen", "University"),
    "Dortmund University of Applied Sciences and Arts": ("Dortmund", "North Rhine-Westphalia", "University of Applied Sciences"),
    "ESMT European School of Management and Technology": ("Berlin", "Berlin", "University"),
    "Eberhard Karls University Tübingen": ("Tübingen", "Baden-Württemberg", "University"),
    "Eberswalde University for Sustainable Development": ("Eberswalde", "Brandenburg", "University of Applied Sciences"),
    "European University Viadrina Frankfurt (Oder)": ("Frankfurt (Oder)", "Brandenburg", "University"),
    "FH Aachen - University of Applied Sciences": ("Aachen", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Fachhochschule of Wedel": ("Wedel", "Schleswig-Holstein", "University of Applied Sciences"),
    "Frankfurt University": ("Frankfurt am Main", "Hesse", "University"),
    "Frankfurt University of Applied Sciences": ("Frankfurt am Main", "Hesse", "University of Applied Sciences"),
    "Free University Berlin": ("Berlin", "Berlin", "University"),
    "Fresenius Heidelberg University": ("Heidelberg", "Baden-Württemberg", "University of Applied Sciences"),
    "Fulda University of Applied Sciences": ("Fulda", "Hesse", "University of Applied Sciences"),
    "Furtwangen University": ("Furtwangen", "Baden-Württemberg", "University of Applied Sciences"),
    "Georg Simon Ohm University of Applied Sciences Nuremberg": ("Nuremberg", "Bavaria", "University of Applied Sciences"),
    "German International University": ("Berlin", "Berlin", "University of Applied Sciences"),
    "Gisma University of Applied Sciences": ("Potsdam", "Brandenburg", "University of Applied Sciences"),
    "Hamburg University of Applied Sciences": ("Hamburg", "Hamburg", "University of Applied Sciences"),
    "Heidelberg University": ("Heidelberg", "Baden-Württemberg", "University"),
    "Heilbronn University": ("Heilbronn", "Baden-Württemberg", "University of Applied Sciences"),
    "Hertie School": ("Berlin", "Berlin", "University"),
    "Hochschule Nordhausen": ("Nordhausen", "Thuringia", "University of Applied Sciences"),
    "Hochschule Schmalkalden": ("Schmalkalden", "Thuringia", "University of Applied Sciences"),
    "Hochschule der Bayerischen Wirtschaft": ("Munich", "Bavaria", "University of Applied Sciences"),
    "Hof University of Applied Sciences": ("Hof", "Bavaria", "University of Applied Sciences"),
    "IU International University": ("Erfurt", "Thuringia", "University of Applied Sciences"),
    "International School of Management": ("Dortmund", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Karlsruhe Institute of Technology (KIT)": ("Karlsruhe", "Baden-Württemberg", "Technical University"),
    "Karlsruhe University of Applied Sciences": ("Karlsruhe", "Baden-Württemberg", "University of Applied Sciences"),
    "Leuphana University Lüneburg": ("Lüneburg", "Lower Saxony", "University"),
    "Ludwig Maximilians University Munich": ("Munich", "Bavaria", "University"),
    "Lübeck University": ("Lübeck", "Schleswig-Holstein", "University"),
    "Media Design University for Design and Computer Science": ("Munich", "Bavaria", "University of Applied Sciences"),
    "Mittweida University of Applied Sciences": ("Mittweida", "Saxony", "University of Applied Sciences"),
    "Munich University of Technology": ("Munich / Garching / Freising", "Bavaria", "Technical University"),
    "Paderborn University": ("Paderborn", "North Rhine-Westphalia", "University"),
    "RWTH Aachen University": ("Aachen", "North Rhine-Westphalia", "Technical University"),
    "Rhine-Waal University of Applied Sciences": ("Kleve", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Rhineland-Palatinate Technical University of Kaiserslautern-Landau": ("Kaiserslautern / Landau in der Pfalz", "Rhineland-Palatinate", "Technical University"),
    "Ruhr University Bochum": ("Bochum", "North Rhine-Westphalia", "University"),
    "SRH University of Applied Sciences Heidelberg": ("Heidelberg", "Baden-Württemberg", "University of Applied Sciences"),
    "Saarland University": ("Saarbrücken / Homburg", "Saarland", "University"),
    "South Westphalia University of Applied Sciences": ("Iserlohn / Meschede / Soest", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Sports University of Cologne": ("Cologne", "North Rhine-Westphalia", "University"),
    "Stuttgart University of Applied Sciences": ("Stuttgart", "Baden-Württemberg", "University of Applied Sciences"),
    "TU Dortmund University": ("Dortmund", "North Rhine-Westphalia", "Technical University"),
    "Technical University Braunschweig": ("Braunschweig", "Lower Saxony", "Technical University"),
    "Technical University of Applied Sciences Würzburg-Schweinfurt": ("Würzburg / Schweinfurt", "Bavaria", "University of Applied Sciences"),
    "Technical University of Applied Sciences of Central Hesse - THM": ("Gießen / Friedberg / Wetzlar", "Hesse", "University of Applied Sciences"),
    "Technical University of Darmstadt": ("Darmstadt", "Hesse", "Technical University"),
    "Technical University of Hamburg": ("Hamburg", "Hamburg", "Technical University"),
    "Technische Hochschule Brandenburg": ("Brandenburg an der Havel", "Brandenburg", "University of Applied Sciences"),
    "Technische Hochschule Deggendorf": ("Deggendorf", "Bavaria", "University of Applied Sciences"),
    "Technische Hochschule Ingolstadt": ("Ingolstadt", "Bavaria", "University of Applied Sciences"),
    "Technische Hochschule Köln": ("Köln", "North Rhine-Westphalia", "University of Applied Sciences"),
    "Technische Universität Dresden": ("Dresden", "Saxony", "Technical University"),
    "Technische Universität Ilmenau": ("Ilmenau", "Thuringia", "Technical University"),
    "University of Applied Sciences Bremen": ("Bremen", "Bremen", "University of Applied Sciences"),
    "University of Applied Sciences Emden/Leer": ("Emden / Leer", "Lower Saxony", "University of Applied Sciences"),
    "University of Applied Sciences Fresenius": ("Idstein", "Hesse", "University of Applied Sciences"),
    "University of Applied Sciences Neu-Ulm": ("Neu-Ulm", "Bavaria", "University of Applied Sciences"),
    "University of Applied Sciences Neubrandenburg": ("Neubrandenburg", "Mecklenburg-Vorpommern", "University of Applied Sciences"),
    "University of Applied Sciences Offenburg": ("Offenburg", "Baden-Württemberg", "University of Applied Sciences"),
    "University of Applied Sciences for Medium-Sized Companies (FHM)": ("Bielefeld", "North Rhine-Westphalia", "University of Applied Sciences"),
    "University of Augsburg": ("Augsburg", "Bavaria", "University"),
    "University of Bayreuth": ("Bayreuth", "Bavaria", "University"),
    "University of Bonn": ("Bonn", "North Rhine-Westphalia", "University"),
    "University of Bremen": ("Bremen", "Bremen", "University"),
    "University of Düsseldorf": ("Düsseldorf", "North Rhine-Westphalia", "University"),
    "University of Erlangen-Nuremberg": ("Erlangen / Nürnberg", "Bavaria", "University"),
    "University of Europe for Applied Sciences": ("Iserlohn / Berlin / Hamburg", "North Rhine-Westphalia", "University of Applied Sciences"),
    "University of Freiburg": ("Freiburg im Breisgau", "Baden-Württemberg", "University"),
    "University of Giessen": ("Gießen", "Hesse", "University"),
    "University of Greifswald": ("Greifswald", "Mecklenburg-Vorpommern", "University"),
    "University of Göttingen": ("Göttingen", "Lower Saxony", "University"),
    "University of Halle-Wittenberg": ("Halle (Saale)", "Saxony-Anhalt", "University"),
    "University of Hamburg": ("Hamburg", "Hamburg", "University"),
    "University of Hannover": ("Hannover", "Lower Saxony", "University"),
    "University of Hildesheim": ("Hildesheim", "Lower Saxony", "University"),
    "University of Hohenheim": ("Stuttgart", "Baden-Württemberg", "University"),
    "University of Jena": ("Jena", "Thuringia", "University"),
    "University of Koblenz": ("Koblenz", "Rhineland-Palatinate", "University"),
    "University of Konstanz": ("Konstanz", "Baden-Württemberg", "University"),
    "University of Magdeburg": ("Magdeburg", "Saxony-Anhalt", "University"),
    "University of Mannheim": ("Mannheim", "Baden-Württemberg", "University"),
    "University of Marburg": ("Marburg", "Hesse", "University"),
    "University of Münster": ("Münster", "North Rhine-Westphalia", "University"),
    "University of Oldenburg": ("Oldenburg", "Lower Saxony", "University"),
    "University of Osnabrück": ("Osnabrück", "Lower Saxony", "University"),
    "University of Passau": ("Passau", "Bavaria", "University"),
    "University of Potsdam": ("Potsdam", "Brandenburg", "University"),
    "University of Regensburg": ("Regensburg", "Bavaria", "University"),
    "University of Rostock": ("Rostock", "Mecklenburg-Vorpommern", "University"),
    "University of Siegen": ("Siegen", "North Rhine-Westphalia", "University"),
    "University of Stuttgart": ("Stuttgart", "Baden-Württemberg", "University"),
    "University of Technology Nuremberg": ("Nürnberg", "Bavaria", "Technical University"),
    "University of Trier": ("Trier", "Rhineland-Palatinate", "University"),
    "University of Ulm": ("Ulm", "Baden-Württemberg", "University"),
    "University of Wuppertal": ("Wuppertal", "North Rhine-Westphalia", "University"),
    "University of Würzburg": ("Würzburg", "Bavaria", "University"),
    "Weihenstephan-Triesdorf University of Applied Sciences": ("Freising", "Bavaria", "University of Applied Sciences"),
    "West Saxon University of Applied Sciences of Zwickau": ("Zwickau", "Saxony", "University of Applied Sciences"),
    "XU Exponential University of Applied Sciences": ("Potsdam", "Brandenburg", "University of Applied Sciences")
}

# Add commonly used short forms or aliases for easy matching
ALIASES = {
    "btu cottbus-senftenberg": "Brandenburgische Technische Universität Cottbus-Senftenberg",
    "btu cottbus senftenberg": "Brandenburgische Technische Universität Cottbus-Senftenberg",
    "rptu kaiserslautern-landau": "Rhineland-Palatinate Technical University of Kaiserslautern-Landau",
    "rptu kaiserslautern landau": "Rhineland-Palatinate Technical University of Kaiserslautern-Landau",
    "utn nuremberg": "University of Technology Nuremberg",
    "utn nurnberg": "University of Technology Nuremberg",
    "fau erlangen-nurnberg": "University of Erlangen-Nuremberg",
    "fau erlangen nurnberg": "University of Erlangen-Nuremberg",
    "fau erlangen-nürnberg": "University of Erlangen-Nuremberg",
    "fau erlangen nürnberg": "University of Erlangen-Nuremberg",
    "tum": "Munich University of Technology",
    "tu munich": "Munich University of Technology",
    "rwth aachen": "RWTH Aachen University",
    "hhu dusseldorf": "University of Düsseldorf",
    "hhu düsseldorf": "University of Düsseldorf",
    "kit": "Karlsruhe Institute of Technology (KIT)",
    "karlsruhe institute of technology": "Karlsruhe Institute of Technology (KIT)",
    "hdbw": "Hochschule der Bayerischen Wirtschaft",
    "hsbi": "Bielefeld University of Applied Sciences and Arts (HSBI)",
    "thm": "Technical University of Applied Sciences of Central Hesse - THM",
    "viadrina": "European University Viadrina Frankfurt (Oder)",
    "giu": "German International University",
    "fhm": "University of Applied Sciences for Medium-Sized Companies (FHM)",
    "fh aachen": "FH Aachen - University of Applied Sciences",
    "tu darmstadt": "Technical University of Darmstadt",
    "technical university of darmstadt": "Technical University of Darmstadt",
    "darmstadt": "Technical University of Darmstadt",
    "tu dresden": "Technische Universität Dresden",
    "tu dresden university": "Technische Universität Dresden",
    "dresden": "Technische Universität Dresden",
    "magdeburg": "University of Magdeburg",
    "ovgu": "University of Magdeburg",
    "koblenz": "University of Koblenz",
    "schmalkalden": "Hochschule Schmalkalden",
    "tuebingen": "Eberhard Karls University Tübingen",
    "tübingen": "Eberhard Karls University Tübingen",
    "freiburg": "University of Freiburg",
    "aachen": "RWTH Aachen University",
    "ulm": "University of Ulm",
    "saarland": "Saarland University",
    "bayreuth": "University of Bayreuth",
    "wuerzburg": "University of Würzburg",
    "würzburg": "University of Würzburg",
    "jena": "University of Jena",
    "rostock": "University of Rostock",
    "passau": "University of Passau",
    "regensburg": "University of Regensburg",
    "siegen": "University of Siegen",
    "trier": "University of Trier",
    "wuppertal": "University of Wuppertal",
    "hannover": "University of Hannover",
    "hildesheim": "University of Hildesheim",
    "oldenburg": "University of Oldenburg",
    "potsdam": "University of Potsdam",
    "marburg": "University of Marburg",
    "mannheim": "University of Mannheim",
    "giessen": "University of Giessen",
    "giesen": "University of Giessen",
    "gießen": "University of Giessen",
    "greifswald": "University of Greifswald",
    "halle": "University of Halle-Wittenberg",
    "konstanz": "University of Konstanz",
    "bonn": "University of Bonn",
    "muenster": "University of Münster",
    "münster": "University of Münster",
    "bielefeld": "University of Bielefeld",
    "goettingen": "University of Göttingen",
    "göttingen": "University of Göttingen",
    "heidelberg": "Heidelberg University",
    "lueneburg": "Leuphana University Lüneburg",
    "lüneburg": "Leuphana University Lüneburg",
    "lubeck": "Lübeck University",
    "lübeck": "Lübeck University"
}

def clean_and_normalize(name: str) -> str:
    """
    Strips accents, converts to lowercase, removes typical punctuation,
    and removes common university word prefixes/suffixes to get a core name.
    """
    if not name:
        return ""
    
    # 1. Decode unicode characters resiliantly
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('ASCII')
    name = name.lower().strip()
    
    # 2. Remove common university filler terms
    name = name.replace("university of applied sciences and arts", "")
    name = name.replace("university of applied sciences", "")
    name = name.replace("university of technology", "")
    name = name.replace("applied sciences", "")
    name = name.replace("university of", "")
    name = name.replace("technische universitat", "")
    name = name.replace("technical university", "")
    name = name.replace("hochschule fur angewandte wissenschaften", "")
    name = name.replace("hochschule der bayerischen wirtschaft", "hdbw")
    name = name.replace("hochschule", "")
    name = name.replace("universitat", "")
    name = name.replace("university", "")
    name = name.replace("fachhochschule", "")
    name = name.replace("school of", "")
    name = name.replace("and arts", "")
    name = name.replace("and law", "")
    
    # 3. Clean special chars
    name = re.sub(r'[^a-z0-9\s-]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

# Precompile normalized database for fast fuzzy/substring matching
NORMALIZED_DB = {}
for canonical_name, data in UNIVERSITY_DATA.items():
    norm_canonical = clean_and_normalize(canonical_name)
    NORMALIZED_DB[norm_canonical] = canonical_name

def resolve_university_details(uni_name: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Resolves the correct City, Federal State, and Institution Type for any given university name.
    
    Returns:
        A tuple of (city_or_location, federal_state, institution_type_string)
        All values are strings or None if unresolved.
    """
    if not uni_name:
        return None, None, None
        
    uni_name_clean = uni_name.strip()
    
    # 1. Direct exact match in master dict (case-insensitive)
    for canonical_name, data in UNIVERSITY_DATA.items():
        if canonical_name.lower() == uni_name_clean.lower():
            return data[0], data[1], data[2]
            
    # 2. Direct alias lookup
    uni_name_lower = uni_name_clean.lower()
    if uni_name_lower in ALIASES:
        canonical_name = ALIASES[uni_name_lower]
        data = UNIVERSITY_DATA[canonical_name]
        return data[0], data[1], data[2]
        
    # 3. Normalized matching (matches clean substring variations)
    norm_input = clean_and_normalize(uni_name_clean)
    if not norm_input:
        return None, None, None
        
    # Exact normalized lookup
    if norm_input in NORMALIZED_DB:
        canonical_name = NORMALIZED_DB[norm_input]
        data = UNIVERSITY_DATA[canonical_name]
        return data[0], data[1], data[2]
        
    # Check if input is a substring of any canonical normalized key, or vice-versa
    for norm_canonical, canonical_name in NORMALIZED_DB.items():
        if norm_input in norm_canonical or norm_canonical in norm_input:
            data = UNIVERSITY_DATA[canonical_name]
            return data[0], data[1], data[2]
            
    # Check if any words match in aliases
    for alias_key, canonical_name in ALIASES.items():
        if alias_key in norm_input or norm_input in alias_key:
            data = UNIVERSITY_DATA[canonical_name]
            return data[0], data[1], data[2]

    # Special fallbacks for standard city names in the university name
    # e.g. "Munich Business School" -> Munich, Bavaria
    standard_cities = {
        "munich": ("Munich", "Bavaria", "University"),
        "münchen": ("Munich", "Bavaria", "University"),
        "cologne": ("Cologne", "North Rhine-Westphalia", "University"),
        "koeln": ("Cologne", "North Rhine-Westphalia", "University"),
        "köln": ("Cologne", "North Rhine-Westphalia", "University"),
        "frankfurt": ("Frankfurt am Main", "Hesse", "University"),
        "berlin": ("Berlin", "Berlin", "University"),
        "hamburg": ("Hamburg", "Hamburg", "University"),
        "stuttgart": ("Stuttgart", "Baden-Württemberg", "University"),
        "heidelberg": ("Heidelberg", "Baden-Württemberg", "University"),
        "karlsruhe": ("Karlsruhe", "Baden-Württemberg", "University"),
        "dortmund": ("Dortmund", "North Rhine-Westphalia", "University"),
        "dusseldorf": ("Düsseldorf", "North Rhine-Westphalia", "University"),
        "düsseldorf": ("Düsseldorf", "North Rhine-Westphalia", "University"),
        "bremen": ("Bremen", "Bremen", "University"),
        "dresden": ("Dresden", "Saxony", "University"),
        "hannover": ("Hannover", "Lower Saxony", "University")
    }
    
    for city_key, data in standard_cities.items():
        if city_key in uni_name_lower:
            return data[0], data[1], data[2]
            
    return None, None, None

def resolve_canonical_university_name(uni_name: str) -> str:
    if not uni_name:
        return ""
    uni_name_clean = uni_name.strip()
    uni_name_lower = uni_name_clean.lower()
    
    # 1. Direct exact match in master dict (case-insensitive)
    for canonical_name in UNIVERSITY_DATA:
        if canonical_name.lower() == uni_name_clean.lower():
            return canonical_name
            
    # 2. Direct alias lookup
    if uni_name_lower in ALIASES:
        return ALIASES[uni_name_lower]
        
    # 3. Normalized matching
    norm_input = clean_and_normalize(uni_name_clean)
    if not norm_input:
        return uni_name_clean
        
    if norm_input in NORMALIZED_DB:
        return NORMALIZED_DB[norm_input]
        
    for norm_canonical, canonical_name in NORMALIZED_DB.items():
        if norm_input in norm_canonical or norm_canonical in norm_input:
            return canonical_name
            
    for alias_key, canonical_name in ALIASES.items():
        if alias_key in norm_input or norm_input in alias_key:
            return canonical_name
            
    return uni_name_clean
