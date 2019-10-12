# CocosCreator-HotUpdate
CocosCreator HotUpdate热更新，从入门到放弃？
###前言：
嗯，之前的游戏是基于cocos2d-x引擎的C++环境下开发的，一直被产品吐槽着不能热更新☹️。没办法终于在半年之后决定改用CocosCreator的JavaScript环境来开发，你爱啥时候更新就啥时候更新。也因为踏上了CocosCreator这只贼船，就有了后面源源不断的故事(；′⌒`)。

#临时有事，我晚点再写。
#临时有事，我晚点再写。
#临时有事，我晚点再写。

临时记录一下怎么修改manifest文件中的内容（主要也就是升级包的地址，别的修改了也不能上天☹️）。
需求是这样的：由于我所不知道的原因，服务器那边要突然将后面的升级包更换服务器路径，心里慌得很，毕竟之前升级包地址都是写死在.manifest文件中的，也没有做动态配置，所以本次只能强制用户升级App，并将App内的.manifest文件内升级包地址改为可以配置的。以后那些服务器端开发人员想逆天都行了。

#####改动之前，我考虑过这样一个问题，App内的project.manifest文件可能存在两份。思考一下为什么？

看我解答：首先我们在发布具备热更新的Creator游戏项目的时候，游戏里面都会有一份（project.manifest、version.manifest）文件。如果有些用户使用过程中进行了热更新，那么App内部指定的热更新目录下就会存在一份新的（project.manifest）文件，当然，下一次的升级包地址也是根据这份新的（project.manifest）文件提供的。所以想动态修改(project.manifest、version.manifest)文件中的内容（主要是更新包地址）,就需要考虑两种情况：
######① 用户从未进行过热更新，这个时候App内的.manifest文件只有一份，我们只需要修改这个.manifest文件即可。
######②用户在安装该App期间使用过热更新，这时候App内部就会存在两份project.manifest文件了，此时我们要修改的project.manifest、version.manifest文件位于当初我们在项目中指定的热更新目录位置。如我的项目是：
```
let storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remoteAssets');
```
#####关于以上两种情况下修改.manifest文件的方法提供如下，可参考我给的思路😁：


######如果之前没有热更，那么手机上也就没有热更的文件(version.manifest、project.manifest、res、src)；此时如果服务器端发布热更新包，并且热更新包的地址与APP打包时候放入的project.manifest文件中地址不一致，那就需要将project.manifest文件地址修改为服务器下发的新地址。问题在于打包时候的project.manifest文件在apk(Android)或ipa(iOS)中,只有读的权限，修改后无法写入！所以：
  `可以考虑读取本地打包时候的project.manifest文件，并将文件中的地址改为服务器下发的新地址，然后不是保存该文件，而是将修改后的文件存放到我们自己创建的路径下(也就是remoteAssets文件夹下面，我们命名为project.manifest文件)。这样在首次更新的时候（服务器修改了地址），就可以使用自定义的remoteAssets文件夹中project.manifest文件进行更新了。`
                 


如果之前已经更新过了，后面服务器更换过更新包地址，我们可以用上面的代码* if (jsb.fileUtils.isFileExist(jsb.fileUtils.getWritablePath() + 'remoteAssets/project.manifest'))*直接判断并找到更新文件中的manifest文件并替换，然后更新。
                 

```
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
                console.log("Written Status : ", isWritten);
            } else {

                /**
                 * 执行到这里说明App之前没有进行过热更，所以不存在热更的remoteAssets文件夹。
                 */

                /**
                 * remoteAssets文件夹不存在的时候，我们就主动创建“remoteAssets”文件夹，并将打包时候的project.manifest文件中升级包地址修改后，存放到“remoteAssets”文件夹下面。
                 */
                let initializedManifestPath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remoteAssets');
                if (!jsb.fileUtils.isDirectoryExist(initializedManifestPath)) jsb.fileUtils.createDirectory(initializedManifestPath);

                console.log("storagePath==", initializedManifestPath);
                console.log("没有下载的manifest文件", newAppHotUpdateUrl);
                console.log("新的地址->", newAppHotUpdateUrl);
                console.log("本地manifest文件地址->", localManifestPath);
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
                console.log("Written Status : ", isWritten);
            }

        } catch (error) {
            console.log("读写manifest文件错误!!!(请看错误详情-->) ", error);
        }

    },
```

还有关于什么时候需要去修改这个.manifest文件。由于项目一启动就会根据服务器的返回值去配置项目环境，这其中肯定会告诉我们App是否需要更新，升级包地址是否有改动。。。,如果一股脑地每次启动都去修改.manifest文件未必太浪费时间，所以建议将原始的升级包地址保存在本地，下次启动的时候根据返回的数据去判断升级包地址是否有改变，如果没有改变则不必修改.manifest，否则就修改.manifest文件。提供API如下：
```
    /**
     * 检测是否需要修改.manifest文件 
     * @param {新的升级包地址} newAppHotUpdateUrl 
     * @param {本地project.manifest文件地址} localManifestPath 
     * @param {修改manifest文件后回调} resultCallback  
     */
    checkNeedModifyManifest(newAppHotUpdateUrl, localManifestPath, resultCallback) {

        if (!cc.sys.isNative) return;  
        console.log("原生平台")

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

```
#临时有事，关于热更新细节我晚点再写。
#临时有事，关于热更新细节我晚点再写。
#临时有事，关于热更新细节我晚点再写。
