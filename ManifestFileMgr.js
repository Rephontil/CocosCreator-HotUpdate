/*
 * @Author: Rephontil.Zhou 
 * @Date: 2018-03-29 12:05:22 
 * @Last Modified by: Rephontil.Zhou 
 * @Last Modified time: 2018-06-12 22:05:23
 */

cc.Class({
    extends: cc.Component,

    /**
     * 检测是否需要修改.manifest文件 
     * @param {新的升级包地址} newAppHotUpdateUrl 
     * @param {本地project.manifest文件地址} localManifestPath 
     * @param {修改manifest文件后回调} resultCallback  
     */
    checkNeedModifyManifest(newAppHotUpdateUrl, localManifestPath, resultCallback) {

        if (!cc.sys.isNative) return;

        let tempUpdateUrl = cc.sys.localStorage.getItem('appHotUpdateUrl');
        //第一次安装并启动的时候，本地没有存储“appHotUpdateUrl”,所以需要将App内的原始升级包地址存放在下面
        if (!tempUpdateUrl) {
            cc.sys.localStorage.setItem("appHotUpdateUrl", cc.vv.appConfig.hotPatchUrl);
        }

        tempUpdateUrl = cc.sys.localStorage.getItem('appHotUpdateUrl');
        console.log("tempUpdateUrl : ", tempUpdateUrl);
        console.log("newAppHotUpdateUrl : ", newAppHotUpdateUrl);

        if (tempUpdateUrl) {
            //如果本地存储的升级包地址和服务器返回的升级包地址相同，则不需要修改.manifest文件。
            // if (tempUpdateUrl == newAppHotUpdateUrl) return;
            //否则 --> 修改manifest文件下载地址
            this.modifyAppLoadUrlForManifestFile(newAppHotUpdateUrl, localManifestPath, function(manifestPath) {
                resultCallback(manifestPath);
            });
        }
    },

    /**
     * 修改.manifest文件
     * @param {新的升级包地址} newAppHotUpdateUrl 
     * @param {本地project.manifest文件地址} localManifestPath 
     * @param {修改manifest文件后回调} resultCallback 
     */
    modifyAppLoadUrlForManifestFile(newAppHotUpdateUrl, localManifestPath, resultCallback) {
        try {
            if (jsb.fileUtils.isFileExist(jsb.fileUtils.getWritablePath() + 'remoteAssets/project.manifest')) {
                console.log("有下载的manifest文件");
                let storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remoteAssets');
                console.log("StoragePath for remote asset : ", storagePath);
                let loadManifest = jsb.fileUtils.getStringFromFile(storagePath + '/project.manifest');
                let manifestObject = JSON.parse(loadManifest);
                manifestObject.packageUrl = newAppHotUpdateUrl;
                manifestObject.remoteManifestUrl = manifestObject.packageUrl + 'project.manifest';
                manifestObject.remoteVersionUrl = manifestObject.packageUrl + 'version.manifest';
                resultCallback(storagePath + '/project.manifest');
                let afterString = JSON.stringify(manifestObject);
                let isWritten = jsb.fileUtils.writeStringToFile(afterString, storagePath + '/project.manifest');
                //更新数据库中的新请求地址，下次如果检测到不一致就重新修改 manifest 文件
                if (isWritten) {
                    cc.sys.localStorage.setItem("appHotUpdateUrl", newAppHotUpdateUrl);
                }
                // console.log("Written Status : ", isWritten);
            } else {

                let initializedManifestPath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remoteAssets');
                if (!jsb.fileUtils.isDirectoryExist(initializedManifestPath)) jsb.fileUtils.createDirectory(initializedManifestPath);
                //修改原始manifest文件
                let originManifestPath = localManifestPath;
                let originManifest = jsb.fileUtils.getStringFromFile(originManifestPath);
                let originManifestObject = JSON.parse(originManifest);
                originManifestObject.packageUrl = newAppHotUpdateUrl;
                originManifestObject.remoteManifestUrl = originManifestObject.packageUrl + 'project.manifest';
                originManifestObject.remoteVersionUrl = originManifestObject.packageUrl + 'version.manifest';
                let afterString = JSON.stringify(originManifestObject);
                let isWritten = jsb.fileUtils.writeStringToFile(afterString, initializedManifestPath + '/project.manifest');
                resultCallback(initializedManifestPath + '/project.manifest');
                if (isWritten) {
                    cc.sys.localStorage.setItem("appHotUpdateUrl", newAppHotUpdateUrl);
                }
                // console.log("Written Status : ", isWritten);
            }

        } catch (error) {
            console.log("读写manifest文件错误!!!(请看错误详情-->) ", error);
        }

    },

});
