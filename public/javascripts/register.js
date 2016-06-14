/**
 * Created by abratin on 6/11/16.
 */
window.onload = function(){
    var invitecode= document.getElementById('invitecode');
    if(invitecode) {
        invitecode.value = getQueryVariable('invitecode');
    }
};

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}