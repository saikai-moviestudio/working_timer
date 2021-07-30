import React, { useState, useEffect } from "react";
import axios from "axios";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import marked from "marked";
import { loadGoogleScript } from "./GoogleLogin";
import { Settings } from "react-feather";
import { Tool } from "react-feather";
import { XCircle } from "react-feather";

const googleClientId =
  "910124176690-go4g2s66msipo9bfdmr8gr4232v9e78i.apps.googleusercontent.com";
const memoApiUrl =
  "https://script.googleapis.com/v1/scripts/AKfycbwCXY7YKm7S1VJv5xGItcsOJuT0JLuvM7wyrm8rrY6H9lcPZ99hGiU3MrRlwV6CKqXV7Q:run";
const OAUTH_API_KEY = process.env.OAUTH_API_KEY;
const scope = "https://www.googleapis.com/auth/spreadsheets";

const Home = () => {
  const [memo, setMemo] = useState("# memo");
  const [gapi, setGapi] = useState();
  const [googleAuth, setGoogleAuth] = useState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  const onSuccess = (googleUser) => {
    setIsLoggedIn(true);
    const profile = googleUser.getBasicProfile();
    console.log(profile.getName() + " : " + profile.getEmail());
    setAccessToken(googleUser.Zb.access_token);
  };

  const onFailure = () => {
    setIsLoggedIn(false);
  };

  const renderSigninButton = (_gapi) => {
    _gapi.signin2.render("google-signin", {
      scope: scope,
      width: 240,
      height: 50,
      longtitle: true,
      theme: "light",
      onsuccess: onSuccess,
      onfailure: onFailure,
    });
  };
  const logOut = () => {
    (async () => {
      await googleAuth.signOut();
      setIsLoggedIn(false);
      renderSigninButton(gapi);
    })();
  };

  useEffect(() => {
    window.onGoogleScriptLoad = () => {
      const _gapi = window.gapi;
      setGapi(_gapi);

      _gapi.load("auth2", () => {
        (async () => {
          const _googleAuth = await _gapi.auth2.init({
            apiKey: OAUTH_API_KEY,
            client_id: googleClientId,
            scope: scope,
          });
          setGoogleAuth(_googleAuth);
          renderSigninButton(_gapi);
        })();
      });
    };

    loadGoogleScript();

    if (localStorage.getItem("memo")) {
      setMemo(localStorage.getItem("memo"));
    }
  }, []);

  const addMemo = () => {
    axios({
      method: "post",
      url: memoApiUrl,
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      data: {
        function: "addMemo",
        parameters: [memo.toString()],
      },
    })
      .then((res) => {
        console.log("上書きテキスト：" + memo);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const readMemo = () => {
    axios({
      method: "post",
      url: memoApiUrl,
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      data: {
        function: "readMemo",
        parameters: [],
      },
    })
      .then((res) => {
        console.log(res.data.response.result.toString());
        setMemo(res.data.response.result.toString());
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const saveMemo = (m) => {
    setMemo(m);
    localStorage.setItem("memo", memo);
  };

  const openSettingModal = () => {
    document.getElementById("homeSettingModal").style.display = "flex";
  };
  const closeSettingModal = () => {
    document.getElementById("homeSettingModal").style.display = "none";
  };

  return (
    <div className="homeItems">
      <div className="homeHeader">
        <div className="homeHeaderTitle">
          <h1>Working</h1>
        </div>
        <button
          className="homeHeaderSetting"
          onClick={() => {
            openSettingModal();
          }}
        >
          <Tool />
        </button>
      </div>
      <div className="homeSettingModal" id="homeSettingModal">
        <button
          className="homeSettingModalLogout"
          onClick={() => {
            logOut();
            closeSettingModal();
          }}
        >
          Logout
        </button>
        <button
          className="homeSettingModalClose"
          onClick={() => {
            closeSettingModal();
          }}
        >
          <XCircle />
        </button>
      </div>
      {!isLoggedIn && <div id="google-signin"></div>}
      <div className="homeMemo">
        <div className="homeMemoBoxEdit">
          <SimpleMDE value={memo} onChange={(e) => saveMemo(e)} />
          <button
            onClick={() => {
              readMemo();
            }}
          >
            同期
          </button>
          <button
            onClick={() => {
              addMemo();
            }}
          >
            上書き
          </button>
        </div>
        <div className="homeMemoBoxView">
          <span dangerouslySetInnerHTML={{ __html: marked(memo) }} />
        </div>
      </div>
    </div>
  );
};

export default Home;
