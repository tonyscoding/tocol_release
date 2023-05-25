require('dotenv').config();
const { notarize } = require('electron-notarize');
exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if(electronPlatformName !== 'darwin') return;

    const appName = context.packager.appInfo.productFilename;
    return await notarize({
        appBundleId: 'kr.co.topolar.topolar',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: 'viv4develop@gmail.com',
        appleIdPassword: 'hmyi-osgs-bnah-ayah'
    })
}