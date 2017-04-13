        var request = require('request');
        var util = require("util");

        var amznProfileURL = 'https://api.amazon.com/user/profile?access_token=';

        amznProfileURL += "Atza|IwEBIC5of2YjJKG-xjFTHmMEvu9kmBf6FtXvmDuHXl2PIgJGcE5D-Sna16k41Agyk6xujPX_GcVNQRFRTNBmiKkgwdupGQ5oOBwSx0GUqZZnsQrDqm0UWrizbZNRDktUU27mJ0am6XNvrTG5iUHPnAGop3D-hJi-BCtfGMtPg5RDXbvN9HsnIkE0YoDWHzUSr-oYE5XKRsgo9V5uQAb49pX_RGMhVT5WQAsc1Rw1FuMcIeoLggGDLGPyF9EeZGqcStAZP5tM8GRS1v9u5_4TV8C5dVVBNW04IKIHWGt41AK0FpeklNhsslFP0gGAb8clgmV0UoDzHR9hz1ncKPPk646BLT365iL8AY2-oUnw8psK1lxcpKz6Rt69zJjvZZ8X8simGbpbHC0lSFThfR7cSk9CBNSufUX3W7z5Z_NhnrN76JiQQdAxLYo0l4MNbTCbFDtuLGlguI8IMBqeH2xbSA2qMKv3FlrP5v3FHgPxdPsoNR07G0Nv0zu7e4rE0UtpVx74H4F1Be72stbdWKe8Ww7asrL9hKrvIBvXsVdLLwf6JCgTM7J8qp8sFGA9JHyLhyidEsLgcLMB2FFAS1SMXNb9PiEj9dErDckpYsfyJlE1TTJG2KLX78_S6f-GChAUyeNOcIs"

        request(amznProfileURL, function(error, response, body) {


            if (response.statusCode == 200) {

                var profile = JSON.parse(body);

                //profile.name.split(" ")[0]
                console.log(util.inspect(profile));

            } else {

                console.log("Hello, I can't connect to Amazon Profile Service right now, try again later");

            }

        });
