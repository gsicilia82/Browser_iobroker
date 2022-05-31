
/* ####################################################################### */
/* ### Nachfolgende Einträge nur optional anpassen ####################### */
/* ####################################################################### */

let startFolder = {"0_userdata.0": {} };

// Hauptpfad für die erstellten States
let path = "VIS.Browser"

// Debug-Log
let debugLog = false;

// Immer alle Adapter anzeigen: D.h. auch nach Adapter-Klick alle anzeigen?
let showAlwaysAll = false;

// Zeichen vor Istwerten
let leadingSign = "🔴";

// Style der Listenpunkte anpassen
let ulStyle = "list-style-type: none;padding-left:20px";
let liStyle = "";

// Style der Buttons anpassen, entspricht Inhalt xyz in html Code: <button style="xyz"> text </button>  
let btnStyle = {
    "folder": "border:none; background-color:transparent; color:red; font-size:1.0em; text-align:left"
};
// border: 2px solid #4CAF50
// "folder": "border:2px solid; background-color:transparent; color:white; font-size:1.0em; text-align:left",

/* ####################################################################### */
/* ### Ab hier nicht mehr ändern ######################################### */
/* ####################################################################### */


let arrSubscribtions = [];
let isStateUpdate = false;

createState(path + ".BrowserJSON", "{}", {
    name: 'JSON für Browserstruktur',
    desc: 'JSON für Browserstruktur',
    type: 'string',
    role: 'value',
    unit: ''
});
createState(path + ".BrowserHTML", "", {
    name: 'JSON für Browserstruktur',
    desc: 'JSON für Browserstruktur',
    type: 'string',
    role: 'value',
    unit: ''
});
createState(path + ".ResetView", "", {
    type: 'boolean',
    role: 'button'
});

createState(path + ".clickTarget", "");


function getSubFolder(startFolder){
    let subFolder = {};
    $(startFolder + '.*').each(function(id, i){
        let tmp = id.replace(startFolder + ".", "").split(".")[0];
        if (!subFolder.hasOwnProperty(tmp)){
            if (getSubNumber(startFolder + "." + tmp) == 0){
                subFolder[tmp] = "state";
            }
            else {
                subFolder[tmp] = {};
            }
        }
    })
    return subFolder
}

function getSubNumber(startFolder){
    let subNumber = 0;
    $(startFolder + '.*').each(function(id, i){ subNumber++; })
    return subNumber
}


let objSubscribtion;
function subscribeStates(){
    objSubscribtion = on({id: arrSubscribtions, change: "ne"}, function (obj) {
        isStateUpdate = true;
        json2html();
    });
}


/* ####################################################################### */
/* ### Es folgen Subscriptions ########################################### */
/* ####################################################################### */

function enableSubscriptions(){

    on({id: "javascript." + instance + "." + path + ".clickTarget", change: "any"}, function (obj) {

        let id = obj.state.val;
        let idSplit = id.split(".");
        let adapter = idSplit[0] + "." + idSplit[1];
        let BrowserJSON = {};

        if (debugLog) console.log(id);

        if (showAlwaysAll) BrowserJSON = JSON.parse(JSON.stringify(startFolder));
        BrowserJSON[adapter] = getSubFolder(adapter);

        let subID = adapter;
        for (let i = 2; i<idSplit.length; i++){
            subID += "." + idSplit[i]; 
            if (i==2){
                BrowserJSON[adapter][idSplit[2]] = getSubFolder(subID);
            }
            if (i==3){
                BrowserJSON[adapter][idSplit[2]][idSplit[3]] = getSubFolder(subID);
            }
            if (i==4){
                BrowserJSON[adapter][idSplit[2]][idSplit[3]][idSplit[4]] = getSubFolder(subID);
            }
            if (i==5){
                BrowserJSON[adapter][idSplit[2]][idSplit[3]][idSplit[4]][idSplit[5]] = getSubFolder(subID);
            }
        }
        setState("javascript." + instance + "." + path + ".BrowserJSON", JSON.stringify(BrowserJSON));
    })


    on({id: "javascript." + instance + "." + path + ".BrowserJSON", change: "any"}, function (obj) {
        // Kein Update durch Istwerte sondern durch JSON-Änderung!
        unsubscribe(objSubscribtion);
        objSubscribtion = null;
        arrSubscribtions = [];
        isStateUpdate = false;
        json2html();
    })


    on({id: "javascript." + instance + "." + path + ".ResetView", change: "any"}, function (obj) {
        let val = obj.state.val;
        if (val){
            unsubscribe(objSubscribtion);
            objSubscribtion = null;
            setState("javascript." + instance + "." + path + ".ResetView", false);
            setState("javascript." + instance + "." + path + ".BrowserJSON", JSON.stringify(startFolder));
            isStateUpdate = false;
            json2html();
        }
    })

}

/* ####################################################################### */
/* ### Konvertierung JSON to HTML ######################################## */
/* ####################################################################### */

// buttonVal = Objekt-ID
function getButtonCode(buttonVal, buttonText){
    let htmlButton;
    htmlButton = "<button "
		        + "style=\"" + btnStyle["folder"] + "\" "
		        + "value=\"" + buttonVal + "\" "
                + "onclick=\"setOnClick" + path.replace(".","") + "(this.value)\">" + buttonText + "</button>";
    return htmlButton
}

function inliner(objID, keyName, ObjJSON){
    let html = "<ul style=\"" + ulStyle + "\">";
    Object.keys(ObjJSON).sort().forEach(function(key) {
        let buttonVal = objID + "." + key;
        let visText = key;
        try {
            visText += " | " + getObject(buttonVal).common.name;
        } catch (err){

        }
        let isFolder = (typeof(ObjJSON[key]) == "object" ? true : false);
        if (isFolder){
            if( Object.keys(ObjJSON[key]).length == 0 ){
                html += "<li style=\"" + liStyle + "\">" + getButtonCode(buttonVal, visText) + "</li>";
            } else {
                html += "<li style=\"" + liStyle + "\">" + getButtonCode(buttonVal, visText) + " " + inliner(objID + "." + key, key, ObjJSON[key]) + "</li>";
            }
        } else {
            if (!isStateUpdate) arrSubscribtions.push(buttonVal);
            html += "<li style=\"" + liStyle + "\">" + visText + "<br>" + leadingSign + " " + getState(buttonVal).val + "</li>";
        }
        
    });
    html += "</ul>";
    return html
}

function json2html(){
    let html = "";
    let BrowserJSON = JSON.parse(getState("javascript." + instance + "." + path + ".BrowserJSON").val);

    html += "<body>";
    html += "<ul style=\"" + ulStyle + "\">";

    Object.keys(BrowserJSON).sort().forEach(function(key) {
        if( Object.keys(BrowserJSON[key]).length == 0 ){
            html += "<li style=\"" + liStyle + "\">" + getButtonCode(key, key) + "</li>";
        }
        else {
            html += "<li style=\"" + liStyle + "\">" + getButtonCode(key, key) + " " + inliner(key, key, BrowserJSON[key]) + "</li>";
        }

    });

    html += "</ul>"
    html += "</body>\n\n";

    // Funktionen für Klick und Doppel-Klick werden direkt im html Code der Buttons hinterlegt    
    html += "<script>\n"
          + "\n"
          + "function setOnClick" + path.replace(".","") + "(val) {\n"
          + "var objID = \"javascript." + instance + "." + path + ".clickTarget\";\n"
          + "servConn.setState(objID, val);}\n"
          + "\n"
          + "function setOnDblClick" + path.replace(".","") + "(val) {\n"
          + "var objID = \"javascript." + instance + "." + path + ".dblClickTarget\";\n"
          + "servConn.setState(objID, val);}\n"
          + "\n"
          + "</script>";

    setState("javascript." + instance + "." + path + ".BrowserHTML", html);
    if (!isStateUpdate) setTimeout(subscribeStates,100);
}

/* ####################################################################### */
/* ### MAIN Funktion ##################################################### */
/* ####################################################################### */

function main(){
    // Set StartFolders
    $('system.adapter.*.alive').each(function(id, i){
        let tmp = id.split(".");
        startFolder[tmp[2] + "." + tmp[3]] = {};
    })
    setState("javascript." + instance + "." + path + ".BrowserJSON", JSON.stringify(startFolder));

    // Reset ClickHistory
    setState("javascript." + instance + "." + path + ".clickTarget", "0~0");

    isStateUpdate = false;
    setTimeout(json2html, 200);
    setTimeout(enableSubscriptions, 500);
}
setTimeout(main, 500);

