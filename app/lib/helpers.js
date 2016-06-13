exports.shareViewImage = function(view, title) {
    var img = view.toImage();
    require('com.alcoapps.socialshare').share({
        status : title,
        image : img,
        androidDialogTitle : title
    });
};

function renameFile(path, newName) {
    "use strict";
    var file = Ti.Filesystem.getFile(path),
        newPath;

    if (_.isEmpty(path) || _.isEmpty(newName)) {
        return;
    }

    if (file.exists()) {
        file.rename(newName);
        file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, newName);
        newPath = file.nativePath;
    }
    file = null;

    return newName;
}
exports.renameFile = renameFile;
