const fs = require('fs');
const https = require('https');
const cheerio = require("cheerio");
const axios = require("axios");
const appRoot = require('app-root-path');
const parseString = require('xml2js').parseString;

//var moment = require('moment');
            //require("moment/min/locales.min");
//require('moment/locale/cs');
            //moment.locale('cs');

const fileName = appRoot.path+'\\tmp\\lasttime.txt';
const url = 'https://www.hzspa.cz/vyjezdy/atom-aktualni-vyjezdy.php';


const itemXtype = null;
/* Model */
const item = (() => {
    let item = {};
        item.id = {};
        item.id.type = null;
        item.id.unique = true;  
        item.eventRegistrationDate = null;    
        item.originDate = null;
        item.statusId = null;
        item.typeId = {};
        item.typeId.type = itemXtype;
        item.typeId.ref = 'Type';      
        item.type = null;
        item.subtypeId = {};
        item.subtypeId.type = itemXtype;
        item.subtypeId.ref = 'Subtype';      
        item.subtype = null;        
        item.noteForMedia =  null;
        item.regionId = {};
        item.regionId.type = itemXtype;
        item.regionId.ref = 'Region';       
        item.region = null;
        item.districtId = {};
        item.districtId.type = itemXtype;
        item.districtId.ref = 'District';         
        item.districtId = null;       
        item.village = null;     
        item.partOfVillage = null;
        item.ORP = null;        
        item.street = null;       
        item.road = null;
        item.detail={};
        item.detail.detail = null;
        return item;
})();


/* Helper - writing last time event in milisecond */
let putFile = (fileName, newData) => {
    fs.writeFileSync(fileName, newData, function (err) {
        if (err) throw err;
      });
}

/* Helper - reading last time event in milisecond */ 
let getFile = (fileName) => {
    return fs.readFileSync(fileName, 'utf8');
}

/* XML reader */
https.get(url , (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        parseString(data, function (err, obj) {
            let lastUnixDate = parseInt( getFile(fileName), 10 );
            let eventUnixDate = null;

            let keys = Object.keys( obj.feed.entry );
            let length = keys.length;
            let result = {};

            for( var i = 0; i < length; i++ ) {
                let events = obj.feed.entry[ keys[ i ] ]; 
                eventUnixDate = Date.parse(events.updated[0]);

                if(eventUnixDate >= lastUnixDate){
                    result[i] = {};
                    result[i]['link'] = events.id[0];
                    result[i]['eventDate'] = events.updated[0];

/* Info for use putFile is bottom this file */
                     putFile(fileName, Date.parse(events.updated[0]));
                     length = i;

                }else{ 
                /* reset loop */
                    length = i;
                }
            }
            //console.log(result);

/* Crawling data ById url  (www.hzspa.cz/vyjezdy/udalost.php?id=xxxxxxxxx) */

            const siteUrl = result[0].link;
            const fetchData = async () => {
                const result = await axios.get(siteUrl);
                return cheerio.load(result.data);
            };

            (async () => {
                const $ = await fetchData();
                let output = [];
                $('body').find('p').each( (i, elem) => {
                    return output.push($(elem).text().trim());
                });  
                getObj(output);
            })();
        });
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});

    let getObj = (obj) => {
    let length = obj.length;
    let re = new RegExp("\d+:\d+");
    for( var i = 0; i < length; i++ ){
        if(obj[i] != ''){
            let o = obj[i].split(':');

            item.id.type = Date.parse(new Date());
            item.id.unique = true;
        if(o[0] == 'Ohlášená' ){ 
            let time = (o[1].trim()+':'+o[2].trim()).match(/\d+:\d+/)[0];   
            item.eventRegistrationDate = time;    
        }
        item.originDate = null;
        item.statusId = null;
        if(o[0] == 'Typ' ){        
            item.type = o[1].trim();
        }
        if(o[0] == 'Podtyp' ){        
            item.subtype = o[1].trim();
        }
        if(o[0] == 'Popis' ){         
            item.noteForMedia =  o[1].trim();
        }

        if(o[0] == 'Kraj' ){         
            item.region = o[1].trim();
        }

        if(o[0] == 'Okres' ){         
            item.districtId = o[1].trim();
        }
        if(o[0] == 'Obec' ){         
            item.village = o[1].trim();
        }
        if(o[0] == 'Část obce' ){         
            item.partOfVillage = o[1].trim();
        }
        item.ORP = null;
        if(o[0] == 'Ulice' ){         
            item.street = o[1].trim();
        }
        if(o[0] == 'Silnice' ){         
            item.road = o[1].trim();
        }
        item.detail={};
        item.detail.detail = null;

        }else{
        /* reset loop */
            length = i;
        }

    }
/* Final output */
    console.log(item);
}


/** Information: (CS)
 * 
 *  funkce putFile zapise do ../tmp/lasttime.txt cas v Unixovem formatu
 *  posledni udalosti. Cas se bere z XML na url:
 *  https://www.hzspa.cz/vyjezdy/atom-aktualni-vyjezdy.php
 * 
 *  Je to proto, abychom usetrily strojovy cas, a nemusely prochazet a
 *  parsovat cele xml-ko. Zapis i s nasledym ctenim je mnohem rychlejsi,
 *  nez kompletni parsovani.
 * 
 *  Misto souboru lze pouzit i casove znacky z Db. To by ale vyzadovalo
 *  mirnou upravu kodu. 
 * 
 */