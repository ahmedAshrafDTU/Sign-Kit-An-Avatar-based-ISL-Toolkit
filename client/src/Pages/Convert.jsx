import '../App.css';
import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import xbot from '../Models/xbot/xbot.glb';
import ybot from '../Models/ybot/ybot.glb';
import xbotPic from '../Models/xbot/xbot.png';
import ybotPic from '../Models/ybot/ybot.png';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function Convert() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  let textFromAudio = useRef();
  let textFromInput = useRef();

  const {
    transcript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
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

    const canvasDiv = document.getElementById("canvas");
    if (canvasDiv) {
      canvasDiv.innerHTML = "";
      canvasDiv.appendChild(ref.renderer.domElement);
    }

    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;

    let loader = new GLTFLoader();
    loader.load(
      bot,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.type === 'SkinnedMesh') {
            child.frustumCulled = false;
          }
        });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
      },
      (xhr) => {
        // loading progress
      }
    );
  }, [ref, bot]);

  ref.animate = () => {
    if (ref.animations.length === 0) {
      ref.pending = false;
      return;
    }
    requestAnimationFrame(ref.animate);
    if (ref.animations[0].length) {
      if (!ref.flag) {
        if (ref.animations[0][0] === 'add-text') {
          setText(prev => prev + ref.animations[0][1]);
          ref.animations.shift();
        } else {
          for (let i = 0; i < ref.animations[0].length;) {
            let [boneName, action, axis, limit, sign] = ref.animations[0][i];
            if (sign === "+" && ref.avatar.getObjectByName(boneName)[action][axis] < limit) {
              ref.avatar.getObjectByName(boneName)[action][axis] += speed;
              ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(ref.avatar.getObjectByName(boneName)[action][axis], limit);
              i++;
            }
            else if (sign === "-" && ref.avatar.getObjectByName(boneName)[action][axis] > limit) {
              ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
              ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(ref.avatar.getObjectByName(boneName)[action][axis], limit);
              i++;
            }
            else {
              ref.animations[0].splice(i, 1);
            }
          }
        }
      }
    }
    else {
      ref.flag = true;
      setTimeout(() => {
        ref.flag = false;
      }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  };

  const sign = (inputRef) => {
    var str = inputRef.current.value.toUpperCase();
    var strWords = str.split(' ');
    setText('');
    for (let word of strWords) {
      if (words[word]) {
        ref.animations.push(['add-text', word + ' ']);
        words[word](ref);
      }
      else {
        for (const [index, ch] of word.split('').entries()) {
          if (index === word.length - 1)
            ref.animations.push(['add-text', ch + ' ']);
          else
            ref.animations.push(['add-text', ch]);
          alphabets[ch] && alphabets[ch](ref);
        }
      }
    }
    if (!ref.pending) {
      ref.pending = true;
      ref.animate();
    }
  };

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  return (
    <div className="dark-bg" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="custom-columns-layout">
          {/* Left Column */}
          <div className="side-column">
            <div className="output-section">
              <div className="section-title">Processed Text</div>
              <textarea rows={3} value={text} className="input-style" readOnly />
            </div>
            <div className="input-section">
              <div className="section-title">Voice Input</div>
              <div className="voice-controls">
                <button className="btn btn-primary" onClick={startListening}>
                  Start
                </button>
                <button className="btn btn-primary" onClick={stopListening}>
                  Stop
                </button>
                <button className="btn btn-primary" onClick={resetTranscript}>
                  Clear
                </button>
              </div>
              <textarea
                rows={3}
                ref={textFromAudio}
                value={transcript}
                placeholder="Speech input will appear here..."
                className="input-style"
              />
              <button
                onClick={() => { sign(textFromAudio); }}
                className="btn btn-primary btn-start"
              >
                Start Animation
              </button>
            </div>
            <div className="input-section">
              <div className="section-title">Text Input</div>
              <textarea
                rows={3}
                ref={textFromInput}
                placeholder="Enter text..."
                className="input-style"
              />
              <button
                onClick={() => { sign(textFromInput); }}
                className="btn btn-primary btn-start"
              >
                Start Animation
              </button>
            </div>
          </div>
          {/* Center Column */}
          <div className="center-column">
            <div className="canvas-container">
              <div id="canvas" style={{ width: "100%", height: "500px" }} />
            </div>
          </div>
          {/* Right Column */}
          <div className="side-column">
            <div className="avatar-selector">
              <div className="section-title">Select Avatar</div>
              <div className="avatar-options">
                <div
                  className={`avatar-option${bot === xbot ? " active" : ""}`}
                  onClick={() => setBot(xbot)}
                >
                  <img src={xbotPic} alt="Red Avatar" />
                </div>
                <div
                  className={`avatar-option${bot === ybot ? " active" : ""}`}
                  onClick={() => setBot(ybot)}
                >
                  <img src={ybotPic} alt="Blue Avatar" />
                </div>
              </div>
            </div>
            <div className="animation-settings">
              <div className="speed-control">
                <label className="form-label">
                  Speed: {Math.round(speed * 100) / 100}
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={speed}
                  onChange={e => setSpeed(Number(e.target.value))}
                  className="w-100"
                />
              </div>
              <div className="pause-control">
                <label className="form-label">
                  Pause: {pause} ms
                </label>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={100}
                  value={pause}
                  onChange={e => setPause(Number(e.target.value))}
                  className="w-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Convert;