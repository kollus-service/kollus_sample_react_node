import React, { Component } from "react";
import './multiDrm.css';
const crypto = require("crypto");
var jwt = require('jsonwebtoken');


export default class multiDrm extends Component {



    constructor(props) {
        super(props);
        this.getStreamingType = this.getStreamingType.bind(this);
        this.createInkaPayload = this.createInkaPayload.bind(this);
        this.createKollusJWT = this.createKollusJWT.bind(this);

    
        this.state = {
                     
        inkaAccessKey: '', // inkaDRM Access Key
        inkaSiteKey: '', // inkaDRM Site Key
        inkaSiteID: '', // inkaDRM Site ID
        inkaIv: '',     // inkaDRM AES 256 Encryption Initialization
        kollusSecurityKey: '', //Kollus Account Key
        kollusCustomKey: '', // Kollus Custom User Key
        clientUserId: '',  // Client User ID
        cid: '',  // Multi DRM Contents ID, Kollus Upload File Key
        mckey: '', // Kollus MediaContentKey
        };
      }



      getStreamingType() {
        let arrBrowsers = [ "MSIE","CriOS","Edge","Edg","Firefox", "Chrome",  "Safari","Opera",  "Trident"];
        let agent = navigator.userAgent
        let userBrowser = '';
    
        arrBrowsers.forEach(function(browser){
            if (agent.indexOf(browser) !== -1) {
                userBrowser = browser;         
                return
            }
        }) 
        switch (userBrowser) {
        case 'MSIE':
            var drmType = "PlayReady";
            var streamingType = "dash";
            break;
        case 'Trident':
             drmType = "PlayReady";
             streamingType = "dash";
            break;
        case 'Edge':
             drmType = "PlayReady";
             streamingType = "dash";
            break;
        case 'Edg':
             drmType = "PlayReady";
             streamingType = "dash";
            break;
        case 'Chrome':
             drmType = "Widevine";
             streamingType = "dash";
            break;
        case 'Firefox':
             drmType = "Widevine";
             streamingType = "dash";
            break;
        case 'Opera':
             drmType = "Widevine";
             streamingType = "dash";
            break;
        case 'Safari':
             drmType = "FairPlay";
             streamingType = "hls";
            break;
        case 'CriOS':
             drmType = "FairPlay";
             streamingType = "hls";
            break;
        }
    
        if (agent.indexOf("Macintosh") && agent.indexOf("Edg")) {
             drmType = "Widevine";
             streamingType = "dash";
        }

        console.log(drmType) 
        console.log(streamingType) 
    
        return [drmType, streamingType];

    }

    createKollusJWT () {
        var clientUserId = this.state.clientUserId;
        let mediaContentKey = this.state.mckey;
        let streamingType = this.getStreamingType()[1];
        let inkaPayload = this.createInkaPayload();
        let securityKey = this.state.kollusSecurityKey;
        let siteID = this.state.inkaSiteID;
        var payload = (
            {
                'expt' : 1640822400,
                'cuid' : clientUserId,
                'mc' : (
                    [{
                        'mckey' : mediaContentKey,
                'drm_policy' : (
                  {
                    'kind' : 'inka',
                    'streaming_type' : streamingType,
                    'data' : (
                      {
                        'license_url' : 'https://license.pallycon.com/ri/licenseManager.do',
                        'certificate_url' : 'https://license.pallycon.com/ri/fpsKeyManager.do?siteId=' + siteID,
                        'custom_header' : (
                          {
                            'key' : 'pallycon-customdata-v2',
                            'value' : inkaPayload
                          }
                        )
                      }
                    )
                  }
                )
                    }]
                )
            }
        );
    
        return jwt.sign(payload,securityKey)
    }


    createInkaPayload() {

        const UTCTime = new Date().toISOString().replace(/\.\d{3}/gi, '');   // inkaDRM TimeStemp
        let drmType = this.getStreamingType()[0];                  // inkaDRM DRM Type
    
        // step1 - ���� ���� �� �Է�
        var token = (
                    {
                      'polocy_version' : 2,
                      'playback_policy' : (
                        {                     
                          'persistent' : false,
                          'license_duration' : 86400,
                          'expire_date' : 1807169600,
                          'rental_duration' : 86400,
                          'playback_duration' : 86400,
                          'allowed_track_types' : "SD_UHD2",                 
                        }
                      ),
                        'security_policy' : [
                            {
                                'widevine': {
                                    'override_device_revocation': true
                                }
                            }
                        ]
                    }
                  );
                  
    
        // step2 - ���̼��� �� ��ȣȭ

        const cipher = crypto.createCipheriv("aes-256-cbc", this.state.inkaSiteKey, this.state.inkaIv);
        let encryptedRule = cipher.update(
        JSON.stringify(token),
        "utf-8",
        "base64"
        );
        encryptedRule += cipher.final("base64");

        
        // step3 - �ؽ� �� ����



        let hashData = {
        siteId: this.state.inkaSiteID,
        accessKey: this.state.inkaAccessKey,
        drmType: drmType,
        userId: this.state.clientUserId,
        cid: this.state.cid,
        token: encryptedRule,
        timestamp: UTCTime
        };

        const hashInput =
        hashData.accessKey +
        hashData.drmType +
        hashData.siteId +
        hashData.userId +
        hashData.cid +
        hashData.token +
        hashData.timestamp;

        console.log("hash input : " + hashInput);

        let hashString = crypto
        .createHash("sha256")
        .update(hashInput)
        .digest("base64");

        console.log("hash string : " + hashString);


        // step4 - ���̼��� ��ū ����
        let tokenData = {
            drm_type: drmType,
            site_id: this.state.inkaSiteID,
            user_id: this.state.clientUserId,
            cid: this.state.cid,
            token: encryptedRule,
            timestamp: UTCTime,
            hash: hashString
          };
          
          console.log("token json : " + JSON.stringify(tokenData));
          
          let base64Token = Buffer.from(JSON.stringify(tokenData)).toString("base64");
          
          console.log("base64 encoded token : " + base64Token);
    
  
    
        return base64Token;
    }
    


     
    
      render() {
        const {kollusCustomKey} = this.state;
        
        return (
          
            <div class="countsort">

                <iframe 
                    id="iframe" 
                    src={"https://v.kr.kollus.com/s?jwt="+this.createKollusJWT()+"&custom_key="+kollusCustomKey+"&player_version=html5" }
                    allowfullscreen 
                    webkitallowfullscreen 
                    mozallowfullscreen 
                    allow="encrypted-media" 
                    class="video">    
                </iframe>

          </div>
                    
        );
      }
}
