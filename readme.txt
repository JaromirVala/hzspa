Celý kód je v jednom souboru app/app.js
Používají se tyto balíčky:
  const fs = require('fs');
  const https = require('https');
  const cheerio = require("cheerio");
  const axios = require("axios");
  const appRoot = require('app-root-path');
  const parseString = require('xml2js').parseString;

Kód funguje tak, že se nejprve zavolá url s xml-kem, funkce https.get(),
kde se vyselectuje z xml link a datum.

Poté se vně fce volá link a parsují se data z tohoto linku do objektu,
který již máme namodelovaný dopředu, z důvodu dodržení správného
pořadí klíčů, které by se při vytváření objektu v iteraci bez modelu
přeházelo.

Finální výstup je ve fci getObj(), je to v souboru ta úplně poslední. 

Některé další informace jsou v komentářích v app.js
