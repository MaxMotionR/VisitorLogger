var args = arguments[0] || {};
var uuid = Ti.Platform.createUUID(),
    imageFileName = "photoId.jpg",
    signatureFileName = "signatureId.jpg",
    helpers = require("helpers"),
    moment = require("alloy/moment"),
    activeButton,
    slide_in,
    slide_out,
    toastWidget = Alloy.createWidget('nl.fokkezb.toast', 'global', {
    // defaults
}),
    toast = toastWidget.show,
    error = toastWidget.error;
;

function closeWindow() {
    $.win3.close();
}

function userCancelled(e) {
    "use strict";
    console.log("**** userCancelled: " + JSON.stringify(e));
}

function accessDenied(e) {
    "use strict";
    console.log("**** accessDenied: " + JSON.stringify(e));
    //TODO confirm text / handle this better / check media perms etc
    //console.log(JSON.stringify(e));
    $.permissionDeniedDialog.show();
}

function report(e) {
    if (activeButton) {
        activeButton.text = "  " + moment(e.value).format("HH:mm");
        activeButton.color = "black";
    }

}

function test() {

}

function shareData() {
    helpers.shareViewImage($.dataView, "Visitor Details");
}

function saveData() {
    //TODO validate data before saving
    var data = {},
        model;
    console.log("**** save data");
    [$.nameField, $.orgn, $.car, $.visiting].forEach(function(field, val) {
        var id = field.getID();
        data[id] = field.getValue();
    });
    [$.arrivalTime, $.departureTime].forEach(function(field, val) {
        field.color = "#c5c5c7";
        data[field.id] = field.text;
    });
    data.uuid = uuid;
    data.creationDate = moment().format();
    model = Alloy.createModel("visitors", data);
    if (model.isValid()) {
        model.save();
        Alloy.Collections.visitors.add(model);
        toast("saved");
        $.arrivalTime.text = "  Time In";
        $.departureTime.text = "  Time Out";
        $.photoImage.image = "/images/myimage.png";
        $.photoImage.height = 0;
        $.signatureImage.image = "/images/myimage.png";
        $.signatureImage.height = 0;
        [$.nameField, $.orgn, $.car, $.visiting].forEach(function(field, val) {
            field.reset();
        });
        //reset uuid
        uuid = Ti.Platform.createUUID();
    } else {
        error("Doh!");
    }
}

function savePhoto(e) {
    console.log("*** savePhoto");
    if (e.media) {
        $.photoImage.height = 120;
        $.photoImage.image = e.media;
        imageFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, imageFileName);
        if (imageFile && imageFile.exists()) {
            imageFile.deleteFile();
        }
        imageFile.write(e.media);
        imageFile.setRemoteBackup(false);
        imagePath = helpers.renameFile(imageFile.nativePath, uuid + "_photo_image");
        imageFile = null;
        console.log(imagePath);
    }
}

function saveSignatureImage(img) {
    console.log("*** savePhoto");
    if (img) {
        imageFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, signatureFileName);
        if (imageFile && imageFile.exists()) {
            imageFile.deleteFile();
        }
        imageFile.write(img);
        imageFile.setRemoteBackup(false);
        imagePath = helpers.renameFile(imageFile.nativePath, uuid + "_sig_image");
        imageFile = null;
        console.log(imagePath);
    }
}

function addPhoto() {
    var options = {
        mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
        success : savePhoto,
        error : accessDenied,
        cancel : userCancelled
    };
    if (Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1) {
        Ti.Media.openPhotoGallery(options);
    } else if (Ti.Media.hasCameraPermissions()) {
        Ti.Media.showCamera(options);
    } else {
        accessDenied();
    }
}

function onAdd() {
    Ti.Media.requestCameraPermissions(function(e) {//jshint ignore:line
        //console.log(JSON.stringify(e));
        addPhoto();
    });
}

function addSignature() {
    $.signatureView.visible = true;
    activeButton = $.arrivalTime;
    $.signatureView.animate(slide_in);
}

function cleanUp() {
    Alloy.Globals.Dispatcher.off("BVSTextField:update", enableSaveButton);
    $.destroy();
}

function eraseMe() {
    $.paint.clear();
}

function showArrivalPicker() {
    $.pickerView.visible = true;
    activeButton = $.arrivalTime;
    $.pickerView.animate(slide_in);
};

$.arrivalTime.addEventListener('click', showArrivalPicker);

$.departureTime.addEventListener('click', function() {
    $.pickerView.visible = true;
    activeButton = $.departureTime;
    $.pickerView.animate(slide_in);
});

slide_in = Titanium.UI.createAnimation({
    bottom : 0
});

slide_out = Titanium.UI.createAnimation({
    bottom : Alloy.Globals.pickerBottom
});

$.bb1.addEventListener("click", function() {
    $.pickerView.animate(slide_out);
    $.pickerView.visible = false;
    activeButton = null;
    Alloy.Globals.Dispatcher.trigger("BVSTextField:update");
});

$.bb2.addEventListener("click", function(e) {
    //alert(JSON.stringify($.sigBox));
    var img;
    switch(e.index) {
    //erase
    case 0:
        $.paint.clear();
        break;
    //cancel
    case 1:
        $.signatureView.animate(slide_out);
        $.signatureView.visible = false;
        break;
    //done
    case 2:
        img = $.paint.toImage();
        saveSignatureImage(img);
        $.signatureImage.height = 120;
        $.signatureImage.image = img;
        $.signatureView.animate(slide_out);
        $.signatureView.visible = false;
        break;
    default:
        //there is no default;
        break;
    }
});

$.nameField.setNextAction(function() {
    $.orgn.focus();
});

$.orgn.setNextAction(function() {
    $.car.focus();
});

$.car.setNextAction(function() {
    $.visiting.focus();
});

$.visiting.setNextAction(function() {
    $.visiting.blur();
    _.defer(function() {
        showArrivalPicker();
    });
});

$.orgn.setBackAction(function() {
    $.nameField.focus();
});

$.car.setBackAction(function() {
    $.orgn.focus();
});

$.visiting.setBackAction(function() {
    $.car.focus();
});

function enableSaveButton() {
    var nameField = $.nameField.isNotEmpty(),
        carField = $.car.isNotEmpty(),
        orgField = $.orgn.isNotEmpty(),
        visitingField = $.visiting.isNotEmpty(),
        arrivalField = ($.arrivalTime.text !== "  Time In") ? true : false;
    if (nameField && carField && orgField && visitingField && arrivalField) {
        $.saveButton.enabled = true;
    } else {
        $.saveButton.enabled = false;
    }
    //console.log($.arrivalTime.text);
}

Alloy.Globals.Dispatcher.on("BVSTextField:update", enableSaveButton);
