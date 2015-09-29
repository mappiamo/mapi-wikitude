cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "runs": true
    },
    {
        "file": "plugins/com.wikitude.phonegap.WikitudePlugin/www/WikitudePlugin.js",
        "id": "com.wikitude.phonegap.WikitudePlugin.WikitudePlugin",
        "clobbers": [
            "WikitudePlugin"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.inappbrowser/www/inappbrowser.js",
        "id": "org.apache.cordova.inappbrowser.inappbrowser",
        "clobbers": [
            "window.open"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.device/www/device.js",
        "id": "org.apache.cordova.device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/cordova-plugin-customurlscheme/www/android/LaunchMyApp.js",
        "id": "cordova-plugin-customurlscheme.LaunchMyApp",
        "clobbers": [
            "window.plugins.launchmyapp"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.1.0",
    "com.wikitude.phonegap.WikitudePlugin": "4.1.0",
    "org.apache.cordova.inappbrowser": "0.6.0",
    "org.apache.cordova.device": "0.3.0",
    "cordova-plugin-customurlscheme": "4.0.0"
}
// BOTTOM OF METADATA
});