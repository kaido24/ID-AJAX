/**
 * Määrab, milliste CA-de sertifikaate plugin näitab.
 * Kui esimene element on "*", siis piirangud puuduvad.
 * Näiteväärtus ["ESTEID-SK", "ESTEID-SK 2007", "ESTEID-SK 2011", "TEST-SK"]
 */
var knownCAList = ["*"];

/**
 *  Javascripti klienditeegi versioon 0.12
 *  Käesoleva JavaScripti klienditeegi dokumentatsiooni levitatakse eraldi
 *  dokumendina "Veebis signeerimise Javascripti klienditeek".
 *  Dokumentatsiooni saamiseks ja muude küsimuste korral pöörduda abi@id.ee
 *
 *  Muudatuste ajalugu:
 *
 *  versioon 0.12 14. märts 2012
 *	- Java appleti toe ärakadumisega seoses muudatus:
 *    kui allkirjastamiskomponendi valikul midagi muud pole leitud ning
 *    jõutakse Java appleti laadimiseni, siis senise appleti laadimise asemel
 *    tuleb hoiatus (vt. veakood 100)
 *	- Veakoodile 100 vastava teksti detailsemaks kirjutamine
 *	- Veakoodi 1500 (Java allkirjastamismoodul ei käivitunud) ära kaotamine
 *
 *  versioon 0.11 7. sept 2011 (Tänud RIK-ile täiendus- ja parandusettepanekute eest!)
 *	- Parandatud/täiendatud pluginate laadimise tingimusi (fallback: digidocPlugin -> activeX -> javaApplet)
 *	- Täiendatud java appleti laadimise ja käimamineku tuvastust
 *	- Parandatud uue plugina (digidocPlugin) vigade jõudmist "üles"
 *	- Hulk pisivigu parandatud
 *	- lisatud veakoodid 9 ja 1500
 *
 *  versioon 0.10 16. mai 2011
 *	- Parandatud loadSigningPlugin() meetodit
 *	- Parandatud certHexToJSON() meetodit (seoses ESTEID-SK 2011 serdi lisandumisega)
 *	- CodeBorne parandused keele toega seoses.
 *
 *  versioon 0.9  6. jaanuar 2011
 *	- Parandatud plugina tuvastust, varasem versioon põstas  10.6 Safariga ccrashi
 *
 *  versioon 0.8, 29. detsember 2010
 *	 - Javascripti teegi API-s muutunud: Meetod getCertificates asendatud getCertificate'ga
 *	 - application/x-digidoc plugina puhul võetud kasutusele meetod getCertificate
 *     kuna getCertificates'i uutes plugina versioonides enam ei ole
 *	 - Lihtsustatud ActiveX-i API kasutamist
 *
 *  versioon 0.7, 15. detsember 2010
 *	 - Lisatud veakoodi 100 kirjeldus
 *
 *  versioon 0.6, 18. oktoober 2010
 *	 - Kõige esimese põlvkonna signeerimise ActiveX-i jaoks vajaliku ASN.1
 *     struktuuri parsimisse lisatud BMPstring välja tüübi tugi
 *	 - Täiustatud plugina laadimise loogikat Macil, parandatud viga mille tõttu
 *     ei laaditud vanu Maci pluginaid
 *
 *  versioon 0.5, 8. oktoober 2010
 *	- Lisatud 2010 aastal levitatava ID-kaardi baastarkvara tugi
 *	- knownCAList toodud globaalseks konfiguratsiooniparameetriks
 *	- puhastatud kood mittevajalikest "debug" fragmentidest
 *
 */

/* ------------------------------------ */
/* --- Muutujad ja andmestruktuurid --- */
/* ------------------------------------ */

var Certificate = {
    id: null,
    cert: null,
    CN: null,
    issuerCN: null,
    keyUsage: null,
    validFrom: "", // Sertifikaadi kehtivuse algusaeg, esitatud kujul dd.mm.yyyy hh:mm:ss, Zulu ajavööndis
    validTo: null // Sertifikaadi kehtivuse lõpuaeg, esitatud kujul dd.mm.yyyy hh:mm:ss, Zulu ajavööndis
}

var getCertificatesResponse = {
    certificates: [],
    returnCode: 0
}

var SignResponse = {
    signature: null,
    returnCode: 0
}

//1..99 on pluginatest tulevad vead
var dictionary = {
    1: {
        est: 'Allkirjastamine katkestati',
        eng: 'Signing was cancelled',
        lit: 'Pasirašymas nutrauktas',
        rus: 'Signing was cancelled',
    },
    2: {
        est: 'Sertifikaate ei leitud',
        eng: 'Certificate not found',
        lit: 'Nerastas sertifikatas',
        rus: 'Certificate not found',
    },
    9: {
        est: 'Vale allkirjastamise PIN',
        eng: 'Incorrect PIN code',
        lit: 'Incorrect PIN code',
        rus: 'Incorrect PIN code',
    },
    12: {
        est: 'ID-kaardi lugemine ebaõnnestus',
        eng: 'Unable to read ID-Card',
        lit: 'Nepavyko perskaityti ID-kortos',
        rus: 'Unable to read ID-Card',
    },
    14: {
        est: 'Tehniline viga',
        eng: 'Technical error',
        lit: 'Techninė klaida',
        rus: 'Technical error',
    },
    15: {
        est: 'Vajalik tarkvara on puudu',
        eng: 'Unable to find software',
        lit: 'Nerasta programinės įranga',
        rus: 'Unable to find software',
    },
    16: {
        est: 'Vigane sertifikaadi identifikaator',
        eng: 'Invalid certificate identifier',
        lit: 'Neteisingas sertifikato identifikatorius',
        rus: 'Invalid certificate identifier',
    },
    17: {
        est: 'Vigane räsi',
        eng: 'Invalid hash',
        lit: 'Neteisinga santrauka',
        rus: 'Invalid hash',
    },
    19: {
        est: 'Veebis allkirjastamise käivitamine on võimalik vaid https aadressilt',
        eng: 'Web signing is allowed only from https:// URL',
        lit: 'Web signing is allowed only from https:// URL',
        rus: 'Web signing is allowed only from https:// URL',
    },
    100: {
        est: 'Teie arvutist puudub allkirjastamistarkvara või ei ole Teie operatsioonisüsteemi ja brauseri korral veebis allkirjastamine toetatud. Allkirjastamistarkvara saate aadressilt https://installer.id.ee',
        eng: 'Web signing module is missing from your computer or web signing is not supported on your operating system and browser platform. Signing software is available from https://installer.id.ee',
        lit: 'Web signing module is missing from your computer or web signing is not supported on your operating system and browser platform. Signing software is available from https://installer.id.ee',
        rus: 'Web signing module is missing from your computer or web signing is not supported on your operating system and browser platform. Signing software is available from https://installer.id.ee',
    }
}

function translate(lang, code, default_message = undefined) {
    var message;
    try {
        message = dictionary[code][lang];
    }
    catch (ex) {
        if (default_message === undefined) {
            message = 'Error with code ' + code + ' occurred.';
        }
        else {
            message = default_message;
        }
    }
    return message;
}

var loadedPlugin = '';

// Exception

function IdCardException(returnCode, message) {
    this.returnCode = returnCode;
    this.message = message;
    this.isError = this.returnCode != 1;
    this.isCancelled = this.returnCode == 1;
}

function isActiveXOK(plugin) {
    return !(plugin == null || typeof (plugin) == "undefined"
      || plugin.readyState != 4 || plugin.object == null
      || typeof (plugin.getSigningCertificate) == "undefined");
}

//2011.08, Ahto, teen nii, et see tagastab nüüd true/false
function checkIfPluginIsLoaded(pluginName, lang) {
    var plugin = document.getElementById('IdCardSigning');

    switch (pluginName) {
        case 'activeX':
            return isActiveXOK(plugin);
            break;
        case 'winMozPlugin':
        case 'macPlugin':
            try {
                var ver = plugin.getVersion();
                return ver !== undefined;
            } catch (ex) {}
            return false;
            break;
        case 'digidocPlugin':
            try {
                // Uue plugina tuvastus - uuel pluginal pole getVersion() meetodit
                // IE-s ei tule siin exceptionit, lihtsalt ver == undefined
                var ver = plugin.version;
                return ver !== undefined;
            } catch (ex) {}
            return false;
            break;
    }
    return false;
}

function getLoadedPlugin() {
    return loadedPlugin;
}

function loadSigningPlugin(lang, pluginToLoad) {
    var pluginHTML = {
        digidocPlugin: '<object id="IdCardSigning" type="application/x-digidoc" style="width: 1px; height: 1px; visibility: hidden;"></object>',
        activeX: '<OBJECT id="IdCardSigning" codebase="EIDCard.cab" classid="clsid:FC5B7BD2-584A-4153-92D7-4C5840E4BC28"></OBJECT>',
        winMozPlugin: '<embed id="IdCardSigning" type="application/idcard-plugin" style="width: 1px; height: 1px; visibility: hidden;" />',
        macPlugin: '<embed id="IdCardSigning" type="application/x-idcard-plugin" style="width: 1px; height: 1px; visibility: hidden;" />',
    };
    var pluginLocation = document.getElementById('pluginLocation');

    if (!lang || lang == undefined) {
        lang = 'est';
    }

    //2011.05.10, ahto - juba plugina laadimisel uuritakse, kas tuldi https pealt.
    if (document.location.href.indexOf("https://") == -1) {
        throw new IdCardException(19, dictionary[19][lang]);
    }

    // Kontrollime, kas soovitakse laadida spetsiifiline plugin
    if (pluginToLoad != undefined) {
        if (pluginHTML[pluginToLoad] != undefined) // Määratud nimega plugin on olemas
        {
            pluginLocation.innerHTML = pluginHTML[pluginToLoad];
            if (!checkIfPluginIsLoaded(pluginToLoad, lang)) {
                throw new IdCardException(100, dictionary[100][lang]);
            }
            loadedPlugin = pluginToLoad;
        }
        else {
            // Tagastame vea, juhtimaks teegi kasutaja tähelepanu valele nimele.
            throw new IdCardException(100, dictionary[100][lang]);
        }
        return;
    }
    else {
        // Esmalt püüame alati laadida uue ID-kaardi baastarkvara plugina (mime tüüp application/x-digidoc)
        // Allkärgnev kontroll on Safari jaoks, et kui plugin puudub ei tuleks kasutajale koledat teadet
        //
        // 2011.05, Ahto kommentaar if lause kohta:
        // Mac+Safari juhul käivitub isPluginSupported, mis vaatab, kas plugin on arvutis olemas või mitte.
        // Teiste OS+Brauseri kombinatsioonide puhul võib lihtsalt uut pluginat laadima minna, aga Mac+Safari
        // puhul, kui püüda uut pluginat ilma selle olemasolu kontrollita laadida, näidatakse kasutajale
        // kole viga, kui pluginat pole.
        if (
            (!(navigator.userAgent.indexOf('Mac') != -1 && navigator.userAgent.indexOf('Safari') != -1)) ||
            isPluginSupported("application/x-digidoc")) {
            pluginLocation.innerHTML = pluginHTML['digidocPlugin'];
            if (checkIfPluginIsLoaded("digidocPlugin", lang)) {
                loadedPlugin = "digidocPlugin";
                return;
            }
        }

        // Kui siia jõuame, siis uue tarkvara pluginat ei ole laaditud ja
        // otsustame brauseri järgi, milline vanadest pluginatest laadida

        if (navigator.userAgent.indexOf('Win') != -1) //
        {
            if (navigator.appVersion.indexOf("MSIE") != -1) {
                // Tuvastasime, et tegu on Windowsi OS-i ja IE-ga, laadime ActiveX-i.
                pluginLocation.innerHTML = pluginHTML['activeX'];
                if (checkIfPluginIsLoaded("activeX", lang)) {
                    loadedPlugin = "activeX";
                    return;
                }
            }
            else if (navigator.userAgent.indexOf("Firefox") != -1) {
                // Tuvastasime, et tegu on Windowsi OS-i ja FF-iga
                navigator.plugins.refresh();
                if (navigator.mimeTypes['application/x-idcard-plugin']) {
                    pluginLocation = pluginHTML['macPlugin'];
                }
                else if (navigator.mimeTypes['application/idcard-plugin']) {
                    pluginLocation = pluginHTML['winMozPlugin'];
                }
                if (checkIfPluginIsLoaded("winMozPlugin", lang)) {
                    loadedPlugin = "winMozPlugin";
                    return;
                }
            }
        }
        else if (navigator.userAgent.indexOf('Mac') != -1
            && (navigator.userAgent.indexOf('Safari') == -1) || isPluginSupported("application/x-idcard-plugin")) {
            pluginLocation = pluginHTML['macPlugin'];
            if (checkIfPluginIsLoaded("macPlugin", lang)) {
                loadedPlugin = "macPlugin";
                return;
            }
        }

        //ühtki pluginat ei suudetud laadida, anname vea
        if (loadedPlugin === undefined || loadedPlugin == "") {
            throw new IdCardException(100, dictionary[100][lang]);
        }
    }
}

function getISO6391Language(lang) {
    var languageMap = {
        est: 'et',
        eng: 'en',
        rus: 'ru',
        et: 'et',
        en: 'en',
        ru: 'ru'
    };
    return languageMap[lang];
}

function digidocPluginHandler(lang) {
    var plugin = document.getElementById('IdCardSigning');

    plugin.pluginLanguage = getISO6391Language(lang);

    this.getCertificate = function () {
        var TempCert;
        var response;
        var tmpErrorMessage;

        try {
            TempCert = plugin.getCertificate();
        } catch (ex) {}

        //2011.08.12, Ahto, saadame vea ülesse
        if (plugin.errorCode != "0") {
            tmpErrorMessage = translate(lang, plugin.errorCode, plugin.errorMessage);
            throw new IdCardException(parseInt(plugin.errorCode), tmpErrorMessage);
        }

        // IE plugin ei tagastanud cert väljal sertifikaati HEX kujul, mistõttu
        // on siia tehtud hack, et sertifikaadi hex kuju võetakse certificateAsHex väljalt
        if (TempCert.cert == undefined) {
            return {
                'id': TempCert.id,
                'cert': TempCert.certificateAsHex,
                'CN': TempCert.CN,
                'issuerCN': TempCert.issuerCN,
                'keyUsage': 'Non-Repudiation',
            //	  'validFrom': TempCert.validFrom,
            //		'validTo': TempCert.validTo,
            };
        }
        return TempCert;
    }

    this.sign = function (id, hash) {
        var response;
        var tmpErrorMessage;

        try {
            response = plugin.sign(id, hash, "");
        } catch (ex) {}

        //2011.08.12, Ahto, saadame vea ülesse
        if (plugin.errorCode != "0") {
            tmpErrorMessage = translate(lang, plugin.errorCode, plugin.errorMessage);
            throw new IdCardException(parseInt(plugin.errorCode), tmpErrorMessage);
        }

        if (response == null || response == undefined || response == "") {
            tmpErrorMessage = translate(lang, 14, plugin.errorMessage);
            throw new IdCardException(14, tmpErrorMessage);
        }
        return eval('' + response);
    }

    this.getVersion = function () {
        return plugin.version;
    }
}

function ActiveXAPIPluginHandler(lang) {
    var plugin = document.getElementById('IdCardSigning');

    this.getCertificate = function () {
        var signcert = plugin.getSigningCertificate();

        if (signcert == null || signcert == undefined || signcert == '') {
            throw new IdCardException(2, translate(lang, 2));
        }

        return certHexToJSON(signcert, plugin.selectedCertNumber);
    }

    this.sign = function (id, hash) {
        var response = plugin.getSignedHash(hash, id);

        if (response == null || response == undefined || response == "") {
            throw new IdCardException(14, translate(lang, 14));
        }
        return eval('' + response);
    }

    //tähtis on hetkel vaid see, et see meetod oleks defineeritud, tagastatav väärtus pole oluline
    this.getVersion = function () {
        try {
            return plugin.getVersion();
        } catch (ex) {}
    }
}

function oldGenericAPIPluginHandler(lang) {
    var plugin = document.getElementById('IdCardSigning');
    var keyUsageRegex = new RegExp("(^| |,)" + "Non-Repudiation" + "($|,)");

    this.getCertificate = function () {
        var response = eval('' + plugin.getCertificates());

        if (response.returnCode != 0) {
            throw new IdCardException(response.returnCode, translate(lang, response.returnCode));
        }

        response.certificates = this.filter(response.certificates);

        if (response.certificates.length == 0) {
            throw new IdCardException(2, translate(lang, 2));
        }
        return response.certificates[0];
    }

    this.sign = function (id, hash) {
        var response = eval('' + plugin.sign(id, hash));

        if (response.returnCode != 0) {
            throw new IdCardException(response.returnCode, translate(lang, response.returnCode));
        }
        return response.signature;
    }

    this.filter = function (certificates) {
        var filteredCertificates = [];
        var now = new Date();

        for (var i in certificates) {
            var cert = certificates[i];

            if (knownCAList[0] == "*") // Kõik CA-d on sobilikud
            {
                // Ajaline võrdlus on välja jäetud cert.validFrom <= now && cert.validTo >= now
                if (keyUsageRegex.exec(cert.keyUsage)) {
                    filteredCertificates[filteredCertificates.length] = cert;
                }
            }
            else { // Filtreerime leitud sertifikaate CA-de põhiselt
                for (var j in knownCAList) {
                    // Ajaline võrdlus on välja jäetud cert.validFrom <= now && cert.validTo >= now
                    if (cert.issuerCN == knownCAList[j] && keyUsageRegex.exec(cert.keyUsage)) {
                        filteredCertificates[filteredCertificates.length] = cert;
                    }
                }
            }
        }
        return filteredCertificates;
    }

    //tähtis on hetkel vaid see, et see meetod oleks defineeritud, tagastatav väärtus pole oluline
    this.getVersion = function () {
        try {
            return plugin.getVersion();
        } catch (ex) {}
    }
}

function IdCardPluginHandler(lang) {
    var plugin = document.getElementById('IdCardSigning');
    var pluginHandler = null;

    if (!lang || lang == undefined) {
        lang = 'est';
    }

    this.choosePluginHandler = function () {
        if (loadedPlugin == "digidocPlugin") {
            return new digidocPluginHandler(lang);
        }
        else if (loadedPlugin == "activeX") {
            return new ActiveXAPIPluginHandler(lang);
        }
        else {
            return new oldGenericAPIPluginHandler(lang);
        }
    }

    this.getCertificate = function () {
        pluginHandler = this.choosePluginHandler();
        return pluginHandler.getCertificate();
    }

    this.sign = function (id, hash) {
        pluginHandler = this.choosePluginHandler();
        return pluginHandler.sign(id, hash);
    }

    this.getVersion = function () {
        pluginHandler = this.choosePluginHandler();
        return pluginHandler.getVersion();
    }
}

/**
 * A helper function to detect if plugin with the given mime-type exists.
 */
function isPluginSupported(pluginName) {
    if (navigator.mimeTypes && navigator.mimeTypes.length
        && navigator.mimeTypes[pluginName]) {
        return true;
    }
    return false;
}

/* ----------------------- */
/* --- Abifunktsioonid --- */
/* ----------------------- */

/**
 *
 *  Javascript trim, ltrim, rtrim
 *  http://www.webtoolkit.info/
 *
 *
 **/

function trim(str, chars) {
    return ltrim(rtrim(str, chars), chars);
}

function ltrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}

function rtrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

/* */

function certPEMToHex(certPEM) {
    certPEM = certPEM.replace(/-----BEGIN CERTIFICATE-----\n/gi, "");
    certPEM = certPEM.replace(/\n-----END CERTIFICATE-----\n/gi, "");
    return bin2hex(base64decode(certPEM));
}

//teeb hex serdist JSON objekti
function certHexToJSON(hexCert, selectedCertNumber) {
    var idCode, firstName, lastName, issuerCN, subjectCN, keyUsage, validFrom, validTo;
    var countCN = 0;
    var countUTCTime = 0;
    var year, yearStr, month, day, hour, minute, second, UTCTime, dateStr;

    var In = {
        value: hexCert
    };
    var Out = {};
    var returnValue;

    convert(In, Out, "decode_HEX");

    asnTreeAsArray = Out.value.toString().split(",");

    for (i = 0; i < asnTreeAsArray.length; i++) {
        try {
            switch (asnTreeAsArray[i]) {
                case "2.5.4.3":
                    if (countCN == 0) {
                        issuerCN = trim(asnTreeAsArray[i + 2], "' ");
                        countCN++;
                    } else if (countCN == 1) {
                        subjectCN = trim(asnTreeAsArray[i + 2], "' ");
                        countCN++;
                    }
                    break;
                case "2.5.4.5":
                    idCode = trim(asnTreeAsArray[i + 2], "' ");
                    break;
                case "2.5.4.4":
                    lastName = trim(asnTreeAsArray[i + 2], "' ");
                    break;
                case "2.5.4.42":
                    firstName = trim(asnTreeAsArray[i + 2], "' ");
                    break;
                case "UTCTime":
                    UTCTime = trim(asnTreeAsArray[i + 1], "' ");
                    year = UTCTime.substring(0, 2);
                    month = UTCTime.substring(2, 4);
                    day = UTCTime.substring(4, 6);
                    hour = UTCTime.substring(6, 8);
                    minute = UTCTime.substring(8, 10);
                    second = UTCTime.substring(10, 12);

                    yearStr = parseInt(trim(year, "0 ")) + 2000;
                    yearStr = yearStr + '';
                    //dateStr = 'new Date(' + yearStr + ',' + parseInt(month) + ',' + parseInt(day) + ',' + parseInt(hour) + ',' + parseInt(minute) + ',' + parseInt(second) + ')';
                    dateStr = 'new Date(' + yearStr + ',' + month + ',' + day + ',' + hour + ',' + minute + ',' + second + ')';

                    if (countUTCTime == 0) {
                        validFrom = dateStr; //new Date(year, month, day, hour, minute, second);
                        //validFrom.setFullYear(validFrom.getFullYear() + 100);
                        countUTCTime++;
                    }
                    else if (countUTCTime == 1) {
                        validTo = dateStr; //new Date(year, month, day, hour, minute, second);
                        //validTo.setFullYear(validTo.getFullYear() + 100);
                        countUTCTime++;
                    }
                    break;
            }

        } catch (ex) {}
    }

    // See koht on väidetavalt seetõttu, et ASN.1 struktuuri parsimisel ei
    // õnnestunud ID-kaardi sertifikaatide korral CN-i korralikult välja lugeda
    if (issuerCN.indexOf("ESTEID-SK") != -1) {
        subjectCN = lastName + "," + firstName + "," + idCode;
    }

    return {
        id: selectedCertNumber,
        cert:  hexCert,
        CN: subjectCN,
        issuerCN: issuerCN,
        keyUsage: 'Non-Repudiation',
        validFrom: validFrom,
        validTo: validTo
    };
}

/**
 *
 * ASN.1 Parsing
 *
 **/

var ID = new Array();
var NAME = new Array();

ID['BOOLEAN'] = 0x01;
ID['INTEGER'] = 0x02;
ID['BITSTRING'] = 0x03;
ID['OCTETSTRING'] = 0x04;
ID['NULL'] = 0x05;
ID['OBJECTIDENTIFIER'] = 0x06;
ID['ObjectDescripter'] = 0x07;
ID['UTF8String'] = 0x0c;
ID['SEQUENCE'] = 0x10;
ID['SET'] = 0x11;
ID['NumericString'] = 0x12;
ID['PrintableString'] = 0x13;
ID['TeletexString'] = 0x14;
ID['IA5String'] = 0x16;
ID['UTCTime'] = 0x17;
ID['GeneralizedTime'] = 0x18;
ID['BMPString'] = 0x1e; //Kui tag == 30

for (var i in ID) {
    NAME[ID[i]] = i;
}

var Bitstring_hex_limit = 4;

var isEncode = new RegExp("[^0-9a-zA-Z\/=+]", "i");
var isB64 = new RegExp("[^0-9a-fA-F]", "i");

function convert(src, ans, mode) {
    var srcValue = src.value.replace(/[\s\r\n]/g, '');

    if (mode == 'auto') {
        if (srcValue.match(isEncode)) {
            mode = 'encode';
        } else if (srcValue.match(isB64)) {
            mode = 'decode_B64';
        } else {
            mode = 'decode_HEX';
        }
    }

    if (mode == 'encode') {
        ans.value = encode(srcValue);
        return;
    } else if (mode == 'decode_B64') {
        if (srcValue.match(isEncode)) {
            if (confirm("Illegal character for Decoding process.\nDo you wish to continue as Encoding process?")) {
                ans.value = encode(srcValue);
                return;
            } else {
                return;
            }
        }
        ans.value = decode(bin2hex(base64decode(srcValue)));
    } else if (mode == 'decode_HEX') {
        ans.value = readASN1(srcValue);
    }
}

function encode(src) {
    var ans;
    return ans;
}

function decode(src) {
    if (src.length % 2 != 0) {
        alert('Illegal length. Hex string\'s length must be even.');
    }
    return readASN1(src);
}

function readASN1(data) {
    var point = 0;
    var object = [];

    while (point < data.length) {

        // Detecting TAG field (Max 1 octet)

        var tag10 = parseInt("0x" + data.substr(point, 2));
        var isSeq = tag10 & 32;
        var isContext = tag10 & 128;
        var tag = tag10 & 31;
        var tagName = isContext ? "[" + tag + "]" : NAME[tag];
        if (tagName == undefined) {
            tagName = "Unsupported_TAG";
        }

        point += 2;

        // Detecting LENGTH field (Max 2 octets)

        var len = 0;
        if (tag != 0x5) { // Ignore NULL
            if (parseInt("0x" + data.substr(point, 2)) & 128) {
                var lenLength = parseInt("0x" + data.substr(point, 2)) & 127;
                if (lenLength > 2) {
                    var error_message = "LENGTH field is too long. (at " + point + ")\nThis program accepts up to 2 octets of Length field.";
                    alert(error_message);
                    return error_message;
                }
                len = parseInt("0x" + data.substr(point + 2, lenLength * 2));
                point += lenLength * 2 + 2; // Special thanks to Mr.(or Ms.) T (Mon, 25 Nov 2002 23:49:29)
            }
            else if (lenLength != 0) { // Special thanks to Mr.(or Ms.) T (Mon, 25 Nov 2002 23:49:29)
                len = parseInt("0x" + data.substr(point, 2));
                point += 2;
            }

            if (len > data.length - point) {
                var error_message = "LENGTH is longer than the rest.\n"; + "(LENGTH: " + len + ", rest: " + data.length + ")";

                alert(error_message);
                return error_message;
            }
        }
        else {
            point += 2;
        }

        // Detecting VALUE

        var val = "";
        if (len) {
            val = data.substr(point, len * 2);
            point += len * 2;
        }

        if (!isSeq) {
            object.push([tagName, getValue(isContext ? 4 : tag, val)]);
        }
        else {
            object.push(readASN1(val))
        }
    }

    return object;
}

function getValue(tag, data) {
    var ret = "";

    if (tag == 1) {
        ret = data ? 'TRUE' : 'FALSE';
    }
    else if (tag == 2) {
        ret = (data.length < 3) ? parseInt("0x" + data) : data + ' : Too long Integer. Printing in HEX.';
    }
    else if (tag == 3) {
        var unUse = parseInt("0x" + data.substr(0, 2));
        var bits = data.substr(2);

        if (bits.length > Bitstring_hex_limit) {
            ret = "0x" + bits;
        }
        else {
            ret = parseInt("0x" + bits).toString(2);
        }
        ret += " : " + unUse + " unused bit(s)";
    }
    else if (tag == 5) {
        ret = "";
    }
    else if (tag == 6) {
        var res = new Array();
        var d0 = parseInt("0x" + data.substr(0, 2));
        res[0] = Math.floor(d0 / 40);
        res[1] = d0 - res[0] * 40;

        var stack = new Array();
        var powNum = 0;
        var i;
        for (i = 1; i < data.length - 2; i = i + 2) {
            var token = parseInt("0x" + data.substr(i + 1, 2));
            stack.push(token & 127);

            if (token & 128) {
                powNum++;
            }
            else {
                var sum = 0;
                for (var j = 0; j < stack.length; j++) {
                    sum += stack[j] * Math.pow(128, powNum--);
                }
                res.push(sum);
                powNum = 0;
                stack = new Array();
            }
        }
        ret = res.join(".");
    }
    else if (NAME[tag] != null && NAME[tag] != undefined && NAME[tag].match(/(BMPString)$/)) {
        var k = 0;
        ret += "'";
        while (k < data.length) {
            ret += String.fromCharCode("0x" + data.substr(k, 4));
            k += 4;
        }
        ret += "'";
    }
    //2009.04.11, Ahto, lisasin siia NAME[tag] != null && NAME[tag] != undefined
    // (siin oli käsitlemata juhtum NAME[30]
    else if (NAME[tag] != null && NAME[tag] != undefined && NAME[tag].match(/(Time|String)$/)) {
        var k = 0;
        ret += "'";
        while (k < data.length) {
            ret += String.fromCharCode("0x" + data.substr(k, 2));
            k += 2;
        }
        ret += "'";
    }
    else {
        ret = data;
    }
    return ret;
}

function bin2hex(bin) {
    var hex = "";
    var i = 0;
    var len = bin.length;

    while (i < len) {
        var h1 = bin.charCodeAt(i++).toString(16);
        hex += (h1.length < 2) ? '0' + h1 : h1;
    }

    return hex;
}

function base64decode(data) {
    if (typeof atob == 'function') {
        return atob(data);
    }

    // The following code if borrowed from
    // http://phpjs.org/functions/base64_decode/
    // Thanks!
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do { // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');
    return dec;
}
