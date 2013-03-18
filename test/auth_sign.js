$(document).ready(function () {

    // mobiil ID'ga autoriseerimise vorm
    $("#mid_form").submit(function (event) {
        Event.stop(event);
        do_mobile_auth();
    });

    // id kaardiga autoriseerimise nupp
    $("#cardauth").click(function (event) {
        Event.stop(event);
        do_card_auth();
    });

    // lisa allkirjastamise plugin lehele
    init_card_plugin();

    // id kaardiga allkirjastamise nupp
    $("#cardsign").click(function (event) {
        Event.stop(event);
        do_card_signing();
    });

    // mobiil id'ga allkirjastamise nupp
    $("#midsign").click(function (event) {
        Event.stop(event);
        do_mobile_signing();
    });

});


function do_card_auth() {
    $("#tulemus").html("Oota...").show();;
    $("#nupp").disabled = true;

    AUTH.cardAuthRequest(function (error, data) {
        if (error) {
            $("#tulemus").html("Viga: <br />" + error.message);
            $("#nupp").disabled = false;
            return;
        }
        $("#tulemus").html("Tulemus: " + Object.toJSON(data));
        $("#nupp").disabled = false;
    });
}

function do_mobile_auth() {
    var phone = $("#phone").val();
    $("#tulemus").html("Oota...").show();
    $("#nupp").disabled = true;

    AUTH.mobileAuthRequest(phone, {
        message: "Testsõnum!"
    }, function (error, data) {
        if (error) {
            $("#tulemus").html("Viga: <br />" + error.message);
            $("#nupp").disabled = false;
            return;
        }
        $("#tulemus").html("Kood: " + data.code);

        AUTH.mobileAuthStatus(data.sid, function (error, data) {
            if (error) {
                $("#tulemus").html("Viga: <br />" + error.message);
                $("#nupp").disabled = false;
                return;
            }
            $("#tulemus").html("Tulemus: " + Object.toJSON(data));
            $("#nupp").disabled = false;
        });
    });
}

function init_card_plugin() {
    $(document).append($('</div>')
        .attr('id', 'pluginLocation')
        .css({'position': 'absolute', 'left': '-1000px', 'top': '-1000px'}));
    AUTH.initSigning();
}

function do_card_signing() {

    // kõigepealt on vaja lisada uus fail, mida allkirjastada
    new Ajax.Request(AUTH.api_url + "addFile", {
        method: 'get',
        parameters: {
            filename: "test.txt",
            contents: $("#contents").val(),
        },
        onComplete: function (response) {
            var data;

            // vigane staatus
            if (response.status != 200) {
                return alert("Server responsed with code " + response.status);
            }

            // vigane JSON
            try {
                data = response.responseText.evalJSON();
            } catch (E) {
                data = {
                    status: "ERROR",
                    "message": "Error parsing JSON"
                }
            }

            // Error
            if (data.status != "OK") {
                return alert(data.message || "Invalid request");
            }

            // alusta allkirjastamist
            AUTH.preparesignatureRequest(data.FID, function (error, data) {
                if (error) {
                    return alert(error.message);
                }
                alert("Signed successfully! ");
                window.location.href = "/auth/getDDOC?fid=" + data.FID;
            });
        }
    });

}

function do_mobile_signing() {
    // kõigepealt on vaja lisada uus fail, mida allkirjastada
    new Ajax.Request(AUTH.api_url + "addFile", {
        method: 'post',
        parameters: {
            filename: "test.txt",
            contents: $("#contents").val(),
        },
        onComplete: function (response) {
            var data;
            // vigane staatus
            if (response.status != 200) {
                return alert("Server responsed with code " + response.status);
            }

            // vigane JSON
            try {
                data = response.responseText.evalJSON();
            } catch (E) {
                data = {
                    status: "ERROR",
                    "message": "Error parsing JSON"
                }
            }

            // Error
            if (data.status != "OK") {
                return alert(data.message || "Invalid request");
            }

            // alusta allkirjastamist
            $("#sign-tulemus").html("Oota...").show();
            AUTH.mobileSignRequest(data.FID, {
                message: "Testsõnum!"
            }, function (error, data) {
                if (error) {
                    return alert(error.message);
                }
                $("#sign-tulemus").html("Kood: " + data.code);
                AUTH.mobileSignStatus(data.sid, function (error, data) {
                    if (error) {
                        return alert(error.message);
                    }
                    alert("Signed successfully! ");
                    window.location.href = "/auth/getDDOC?fid=" + data.FID;
                });
            });
        }
    });
}
