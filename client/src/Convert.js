import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import Slider from "react-input-slider";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";

import xbot from "../Models/xbot/xbot.glb";
import ybot from "../Models/ybot/ybot.glb";
import xbotPic from "../Models/xbot/xbot.png";
import ybotPic from "../Models/ybot/ybot.png";

import * as words from "../Animations/words";
import * as alphabets from "../Animations/alphabets";
import { defaultPose } from "../Animations/defaultPose";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { useSpeechRecognition } from "react-speech-recognition";

function Convert() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);

  const componentRef = useRef({});
  const { current: ref } = componentRef;
  const textFromInput = useRef(null);

  const { 
    transcript,
    resetTranscript,
    startListening,
    stopListening
  } = useSpeechRecognition();

  useEffect(() => {
    // إعدادات المشهد ثلاثي الأبعاد
    ref.flag = false;
    ref.pending = false;
    ref.animations = [];
    ref.characters = [];
    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0x000000);
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);
    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
    ref.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth * 0.57 / (window.innerHeight - 70),
      0.1,
      1000
    );
    ref.renderer.setSize(window.innerWidth * 0.57, window.innerHeight - 70);
    const canvasContainer = document.getElementById("canvas");
    canvasContainer.innerHTML = "";
    canvasContainer.appendChild(ref.renderer.domElement);
    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;
    const loader = new GLTFLoader();
    loader.load(
      bot,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.type === "SkinnedMesh") {
            child.frustumCulled = false;
          }
        });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
      },
      (xhr) => {
        console.log(xhr);
      }
    );

    const handleResize = () => {
      ref.camera.aspect = window.innerWidth * 0.57 / (window.innerHeight - 70);
      ref.camera.updateProjectionMatrix();
      ref.renderer.setSize(window.innerWidth * 0.57, window.innerHeight - 70);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ref, bot]);

  ref.animate = () => {
    if (ref.animations.length === 0) {
      ref.pending = false;
      return;
    }
    requestAnimationFrame(ref.animate);
    if (ref.animations[0].length) {
      if (!ref.flag) {
        if (ref.animations[0][0] === "add-text") {
          setText(text + ref.animations[0][1]);
          ref.animations.shift();
        } else {
          for (let i = 0; i < ref.animations[0].length;) {
            let [boneName, action, axis, limit, sign] = ref.animations[0][i];
            if (
              sign === "+" &&
              ref.avatar.getObjectByName(boneName)[action][axis] < limit
            ) {
              ref.avatar.getObjectByName(boneName)[action][axis] += speed;
              ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(
                ref.avatar.getObjectByName(boneName)[action][axis],
                limit
              );
              i++;
            } else if (
              sign === "-" &&
              ref.avatar.getObjectByName(boneName)[action][axis] > limit
            ) {
              ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
              ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(
                ref.avatar.getObjectByName(boneName)[action][axis],
                limit
              );
              i++;
            } else {
              ref.animations[0].splice(i, 1);
            }
          }
        }
      }
    } else {
      ref.flag = true;
      setTimeout(() => { ref.flag = false; }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  };

  const sign = (inputRef) => {
    const str = inputRef.current.value.toUpperCase();
    const strWords = str.split(" ");
    setText("");
    for (let word of strWords) {
      if (words[word]) {
        ref.animations.push(["add-text", word + " "]);
        words[word](ref);
      } else {
        for (const [index, ch] of word.split("").entries()) {
          if (index === word.length - 1)
            ref.animations.push(["add-text", ch + " "]);
          else ref.animations.push(["add-text", ch]);
          alphabets[ch](ref);
        }
      }
    }
  };

  return (
    <div className="dark-bg">
      <div className="container">
        <div className="custom-columns-layout">
          {/* العمود الأول - Input Section */}
          <div className="side-column">
            <div className="input-section">
              <h4 className="section-title">Text Input</h4>
              <textarea 
                ref={textFromInput}
                placeholder="Type text here..."
              />
              <button
                className="btn btn-primary"
                onClick={() => sign(textFromInput)}
              >
                Start Animation
              </button>
            </div>

            <div className="input-section">
              <h4 className="section-title">Voice Input</h4>
              <div className="voice-controls">
                <button className="btn" onClick={startListening}>
                  Start
                </button>
                <button className="btn" onClick={stopListening}>
                  Stop
                </button>
                <button className="btn" onClick={resetTranscript}>
                  Clear
                </button>
              </div>
              <textarea 
                value={transcript}
                readOnly
                placeholder="Speech input will appear here..."
              />
            </div>
          </div>

          {/* العمود الثاني - Model Section */}
          <div className="center-column">
            <div className="canvas-container">
              <div id="canvas" />
            </div>
          </div>

          {/* العمود الثالث - Output Section */}
          <div className="side-column">
            <div className="output-section">
              <h4 className="section-title">Processed Text</h4>
              <textarea value={text} readOnly />
            </div>

            <div className="output-section">
              <h4 className="section-title">Animation Settings</h4>
              <div className="speed-control">
                <label className="form-label">Speed: {speed.toFixed(2)}</label>
                <Slider
                  axis="x"
                  xmin={0.05}
                  xmax={1}
                  x={speed}
                  onChange={({ x }) => setSpeed(x)}
                  styles={{
                    track: { backgroundColor: "#8a8a8a", height: "5px" },
                    active: { backgroundColor: "#0a58ca" },
                    thumb: { backgroundColor: "#0a58ca", width: "15px", height: "15px" }
                  }}
                />
              </div>
              <div className="pause-control">
                <label className="form-label">Pause: {pause} ms</label>
                <Slider
                  axis="x"
                  xmin={200}
                  xmax={1000}
                  x={pause}
                  onChange={({ x }) => setPause(x)}
                  styles={{
                    track: { backgroundColor: "#8a8a8a", height: "5px" },
                    active: { backgroundColor: "#0a58ca" },
                    thumb: { backgroundColor: "#0a58ca", width: "15px", height: "15px" }
                  }}
                />
              </div>
              
              <div className="avatar-selector">
                <h4 className="section-title">Select Avatar</h4>
                <div className="avatar-options">
                  <div 
                    className={`avatar-option ${bot === xbot ? 'active' : ''}`}
                    onClick={() => setBot(xbot)}
                  >
                    <img src={xbotPic} alt="XBOT Avatar" />
                  </div>
                  <div 
                    className={`avatar-option ${bot === ybot ? 'active' : ''}`}
                    onClick={() => setBot(ybot)}
                  >
                    <img src={ybotPic} alt="YBOT Avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Convert;