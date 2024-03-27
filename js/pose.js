function startVideo() {
  document.getElementById("btnPlay").style.display = "none";
  var video = document.getElementById("myVideo");
  video.style.display = "block";
  video.play();
}

function videoEnded() {
  var video = document.getElementById("myVideo");
  video.classList.add("fade-out");
  // video.style.display = "none";
  // alert("前導播放完畢！");
  // 使用Promise和async/await创建延迟
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  (async () => {
    await delay(2000); // 这里的1000表示延迟1秒，您可以根据需要调整延迟的时间
    pose.onResults(onResultsPose);
  })();
}
const video5 = document.getElementsByClassName("input_video5")[0];
const out5 = document.getElementsByClassName("output5")[0];
const controlsElement5 = document.getElementsByClassName("control5")[0];
const canvasCtx5 = out5.getContext("2d");

const fpsControl = new FPS();

const spinner = document.querySelector(".loading");
spinner.ontransitionend = () => {
  spinner.style.display = "none";
};

function zColor(data) {
  const z = clamp(data.from.z + 0.5, 0, 1);
  return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
}

const overlayImages = []; // 儲存叠加物體的陣列
const fadeOutDuration = 10000; // 淡化消失的持續時間（毫秒）
const fadeOutSteps = 10000; // 淡化消失的部署
const fadeOutInterval = fadeOutDuration / fadeOutSteps; // 每步的時間間隔

function fadeOutOverlayImages() {
  let opacityStep = 1 / fadeOutSteps; // 每步的不透明度变化量

  // 定時器控制淡化消失效果
  const fadeOutTimer = setInterval(() => {
    // 每個叠加物體
    overlayImages.forEach((overlayImage, index) => {
      let currentOpacity = parseFloat(overlayImage.style.opacity || 1); // 當前不透明度
      let newOpacity = Math.max(0, currentOpacity - opacityStep); // 新的不透明度

      // 更新叠加物體的不透明度
      overlayImage.style.opacity = newOpacity;

      // 如果不透明度已經為0，移除叠加物體
      if (newOpacity === 0) {
        document.body.removeChild(overlayImage);
        overlayImages.splice(index, 1);
      }
    });

    // 如果所有叠加物體都已经消失，則清除定時器
    if (overlayImages.length === 0) {
      clearInterval(fadeOutTimer);
    }
  }, fadeOutInterval);
}

function onResultsPose(results) {
  document.body.classList.add("loaded");
  fpsControl.tick();

  // 清除上一幀的內容
  canvasCtx5.clearRect(0, 0, out5.width, out5.height);

  // for (let i = 0; i < results.poseLandmarks.length; i++) {
  const landmark = results.poseLandmarks[0];
  const x = landmark.x * out5.width * 5;
  const y = landmark.y * out5.height * 5;

  // 創建一個新的overlayImage元素
  const overlayImage = document.createElement("img");
  overlayImage.src = "./img/dot.png"; // 設置疊加圖像的路徑
  overlayImage.style.position = "absolute";

  // 設置疊加圖像的位置
  overlayImage.style.left = `${x}px`;
  overlayImage.style.top = `${y}px`;

  // 設置疊加圖像的大小
  overlayImage.style.width = "15px";
  overlayImage.style.height = "15px";

  // 將疊加圖像放到頁面上
  document.body.appendChild(overlayImage);

  // 將疊加圖像儲存到陣列中
  overlayImages.push(overlayImage);

  // 繪製連接線和關鍵點
  drawConnectors(canvasCtx5, [landmark], POSE_CONNECTIONS, {
    color: (data) => {
      return "#FF0000";
    },
  });

  drawLandmarks(canvasCtx5, [landmark], {
    color: zColor,
    fillColor: "#FF0000",
  }); // 繪製關鍵點
  // }

  // 繪製攝影機圖像
  canvasCtx5.drawImage(results.image, 0, 0, out5.width, out5.height);

  // 開始淡化效果
  fadeOutOverlayImages();
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
  },
});
// pose.onResults(onResultsPose);

const camera = new Camera(video5, {
  onFrame: async () => {
    await pose.send({ image: video5 });
  },
  width: 1080,
  height: 720,
});
camera.start();

new ControlPanel(controlsElement5, {
  selfieMode: true,
  upperBodyOnly: false,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})
  .add([
    new StaticText({ title: "MediaPipe Pose" }),
    fpsControl,
    new Toggle({ title: "Selfie Mode", field: "selfieMode" }),
    new Toggle({ title: "Upper-body Only", field: "upperBodyOnly" }),
    new Toggle({ title: "Smooth Landmarks", field: "smoothLandmarks" }),
    new Slider({
      title: "Min Detection Confidence",
      field: "minDetectionConfidence",
      range: [0, 1],
      step: 0.01,
    }),
    new Slider({
      title: "Min Tracking Confidence",
      field: "minTrackingConfidence",
      range: [0, 1],
      step: 0.01,
    }),
  ])
  .on((options) => {
    video5.classList.toggle("selfie", options.selfieMode);
    pose.setOptions(options);
  });
