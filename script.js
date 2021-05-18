document.body.classList.add("loading");
const video = document.getElementById("videoCapture"); // video is the id of video tag
const canvas = document.getElementById("canvasFrame");
let context = canvasFrame.getContext("2d");
let isPlaying = false;
let localStream;

let height, width;
let frame;
let dst;

let List = [[]];
let cList = [[]];
let lineColor = [0, 0, 0, 255];
let isDrawing = false;

const FPS = 30;

const setSize = () => {
  frame = new cv.Mat(height, width, cv.CV_8UC4);
  dst = new cv.Mat(height, width, cv.CV_8UC1);
};

const renderLines = (x, y) => {
  List[List.length - 1].push([x, y]);
};

const getStream = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = localStream;
  video.play();

  video.onplaying = () => {
    height = video.videoHeight;
    width = video.videoWidth;
    setSize();
  };
};

const draw = () => {
  cv.flip(frame, frame, 1);
  let hsv = new cv.Mat();
  cv.cvtColor(frame, hsv, cv.COLOR_RGB2HSV);
  // console.log(hsv.type());
  lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [44, 78, 74, 0]);
  upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [84, 255, 183, 1]);
  // console.log("BEFORE::::::::::", hsv);
  cv.inRange(hsv, lower, upper, hsv);
  lower.delete();
  upper.delete();

  let temp = new cv.Mat();
  cv.bitwise_and(frame, frame, temp, (mask = hsv));
  cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
  let blur = new cv.Mat();
  cv.medianBlur(temp, blur, 7);
  temp.delete();

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(
    blur,
    contours,
    hierarchy,
    cv.RETR_TREE,
    cv.CHAIN_APPROX_SIMPLE
  );
  hierarchy.delete();

  if (contours.size() > 0) {
    let cnt = contours.get(0);
    let circle = cv.minEnclosingCircle(cnt);

    cv.circle(frame, circle.center, circle.radius, [0, 255, 0, 255], 4);
    renderLines(~~circle.center.x, ~~circle.center.y);
    isDrawing = true;
    cnt.delete();
  } else {
    if (isDrawing) {
      List.push([]);
      cList.push([]);
    }
    isDrawing = false;
  }

  cv.imshow("canvasFrame", frame);

  for (let i of List) {
    if (i.length !== 0) {
      // console.log(i);
      context.beginPath();
      context.moveTo(i[0][0], i[0][1]);
      for (j of i) {
        context.lineTo(j[0], j[1]);
      }
      context.lineWidth = 4;

      context.stroke();
    }
  }

  contours.delete();
  blur.delete();
  hsv.delete();
};

const processVideo = () => {
  context.drawImage(video, 0, 0, width, height);
  if (frame) {
    frame.data.set(context.getImageData(0, 0, width, height).data);
    // let hsv = new cv.Mat();
    // cv.cvtColor(frame, hsv, cv.COLOR_RGB2HSV);
    // cv.cvtColor(hsv, dst, cv.COLOR_BGR2HSV);
    draw();
    // frame.delete();
  }

  video.requestVideoFrameCallback(processVideo);
};

document.getElementById("circlesButton").onclick = () => {
  this.disabled = true;
  document.body.classList.add("loading");

  if (isPlaying) {
    localStream.getVideoTracks()[0].stop();
    video.srcObject = null;
    isPlaying = false;
    // console.log(List);
    // write the code to clean the matrices
  } else {
    getStream();
    isPlaying = true;

    video.requestVideoFrameCallback(processVideo);
  }

  this.disabled = false;
  document.body.classList.remove("loading");
};

function onOpenCvReady() {
  document.body.classList.remove("loading");
}
