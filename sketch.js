let capture;
let facemesh;
let handpose;
let predictions = [];
let hands = [];
let earringImages = [];
let currentSelection = 0; // 預設顯示第一款耳環 (索引 0)
let maskImg;

function preload() {
  // 預載入五款耳環圖片
  earringImages = [
    loadImage('pic/acc1_ring.png'),
    loadImage('pic/acc2_pearl.png'),
    loadImage('pic/acc3_tassel.png'),
    loadImage('pic/acc4_jade.png'),
    loadImage('pic/acc5_phoenix.png')
  ];
  // 載入面具圖片
  maskImg = loadImage('mask/4379901.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 檢查 ml5 是否成功載入
  if (typeof ml5 === 'undefined') {
    alert("ml5.js 函式庫未載入，請檢查 index.html 是否已包含 <script src='https://unpkg.com/ml5@latest/dist/ml5.min.js'></script>");
    return;
  }

  // 建立攝影機並處理可能的錯誤
  capture = createCapture(VIDEO, (stream) => {
    console.log("攝影機啟動成功");
  });
  
  // 設定擷取影像的寬高為全螢幕的 50%
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
  capture.hide(); // 隱藏原本產生的 HTML video 標籤

  // 初始化 ml5.facemesh 影像辨識
  facemesh = ml5.facemesh(capture, () => console.log("模型載入完成"));
  // 當偵測到臉部特徵時，將結果存入 predictions 陣列
  facemesh.on("predict", results => predictions = results);

  // 初始化 ml5.handpose 手勢辨識
  handpose = ml5.handpose(capture, () => console.log("手勢模型載入完成"));
  // 當偵測到手部特徵時，將結果存入 hands 陣列
  handpose.on("predict", results => hands = results);
}

function draw() {
  background('#e7c6ff');

  push();
  // 將繪圖原點移至畫布中心
  translate(width / 2, height / 2);
  // 水平翻轉影像（左右顛倒）
  scale(-1, 1);
  imageMode(CENTER);
  image(capture, 0, 0, width * 0.5, height * 0.5);

  // 手勢偵測邏輯：判斷伸出的手指數量
  if (hands.length > 0) {
    let landmarks = hands[0].landmarks;
    let count = 0;
    
    // 簡單的指尖高度判斷 (比對指尖 y 座標與指根或關節 y 座標)
    // 食指 (8), 中指 (12), 無名指 (16), 小指 (20)
    if (landmarks[8][1] < landmarks[6][1]) count++;
    if (landmarks[12][1] < landmarks[10][1]) count++;
    if (landmarks[16][1] < landmarks[14][1]) count++;
    if (landmarks[20][1] < landmarks[18][1]) count++;
    
    // 拇指 (4) 判斷 (簡單判斷 y 座標)
    if (landmarks[4][1] < landmarks[2][1]) count++;

    // 如果偵測到 1~5 根手指，切換對應的耳環
    if (count >= 1 && count <= 5) {
      currentSelection = count - 1;
    }
  }

  // 繪製耳垂辨識結果
  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      let keypoints = predictions[i].scaledMesh;
      // 取得左右耳垂座標 (索引 147 為右耳垂, 376 為左耳垂)
      let rightEarlobe = keypoints[147];
      let leftEarlobe = keypoints[376];

      // 計算臉部範圍以便覆蓋面具
      // 關鍵點索引說明：10 為額頭頂端, 152 為下巴底端, 234 為右臉邊緣, 454 為左臉邊緣
      let topHead = keypoints[10];
      let bottomChin = keypoints[152];
      let leftSide = keypoints[234];
      let rightSide = keypoints[454];

      let faceWidth = dist(leftSide[0], leftSide[1], rightSide[0], rightSide[1]) * 1.5;
      let faceHeight = dist(topHead[0], topHead[1], bottomChin[0], bottomChin[1]) * 1.5;
      let centerX = (leftSide[0] + rightSide[0]) / 2 - capture.width / 2;
      let centerY = (topHead[1] + bottomChin[1]) / 2 - capture.height / 2;

      // 繪製面具圖片
      image(maskImg, centerX, centerY, faceWidth, faceHeight);

      fill(255, 255, 0); // 黃色
      noStroke();
      // 座標轉換：將相對於影像左上角的座標，轉換為相對於中心點的座標
      ellipse(rightEarlobe[0] - capture.width / 2, rightEarlobe[1] - capture.height / 2, 15);
      ellipse(leftEarlobe[0] - capture.width / 2, leftEarlobe[1] - capture.height / 2, 15);

      // 根據手勢選擇顯示對應的耳環圖片
      let currentEarring = earringImages[currentSelection];
      // 設定寬高為 50 像素（可依需求調整圖片大小）
      image(currentEarring, rightEarlobe[0] - capture.width / 2, rightEarlobe[1] - capture.height / 2, 50, 50);
      image(currentEarring, leftEarlobe[0] - capture.width / 2, leftEarlobe[1] - capture.height / 2, 50, 50);
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
}
