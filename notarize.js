require('dotenv').config();
const { notarize } = require('electron-notarize');
exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if(electronPlatformName !== 'darwin') return;

    const appName = context.packager.appInfo.productFilename;
    return await notarize({
        appBundleId: 'kr.co.topolar.topolar',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: 'hansol.choi@tonyscoding.com',
        appleIdPassword: 'smtu-illr-pisu-luvw'
    })
}