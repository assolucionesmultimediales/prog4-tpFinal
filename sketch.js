//ml5 + p5: 1 gota que "la red" pulgar–índice puede atrapar ===
let handPose,
  video,
  hands = [];

// estrella
let posX,
  posY = 0;
const speedY = 2;
const dropR = 10; // radio fijo para detectar bien
let estrellita;
let velocidad = 2;
let contadorEstrellas = 0;

// suavizado de tips, aunque no los muestre, si los saco, el programa deja de correr
let smThumb = { x: 0, y: 0, ready: false };
let smIndex = { x: 0, y: 0, ready: false };

//fantasma
let fantasma;
let ghostX,
  ghostY = 0;
let ghostSpeedY = 7;
const GHOST_SCALE = 0.6; // más chico
let contadorFantasmas = 0;

//fuente
let fuente;
let mostrarLose = false;
let mostrarWin = false;

//puntajes
let puntaje = 0;
let sumaPuntos = 1;
let restaPuntos = 1;

function preload() {
  handPose = ml5.handPose(); // API nueva (v1.x)
  estrellita = loadImage("assets/estrellita.gif");
  fantasma = loadImage("assets/fantasma.gif");
  fuente = loadFont("assets/ARCADE_N.TTF");
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);

  // inicio de la posicion de la estrella que cae
  posX = random(50, width - 70);
  posY = 0;

  //inicio del fantasma
  ghostX = random(50, width - 70);
  ghostY = 0;

  //texto
  textAlign(CENTER);
  textFont(fuente);
  rectMode(CENTER);
}

function draw() {
  image(video, 0, 0, width, height);

  //puntaje
  push();
  fill("yellow");
  noStroke();
  rect(83, 43, 140, 40, 10);
  pop();
  push();
  fill("#e185c7");
  noStroke();
  textSize(12);
  text("PUNTAJE:" + puntaje, 80, 50);
  pop();

  //muestro cantidad de estrellas y fantasmas
  //estrellas
  push();
  noStroke();
  textFont(fuente);
  textSize(14);
  textAlign(CENTER);
  fill(255); 
  iconX = 10;
  iconY = 81;
  textAlign(LEFT, CENTER);
  image(estrellita, iconX, iconY - 1, 28, 28); 
  text(":" + contadorEstrellas, iconX + 24, iconY + 15);  
  pop();

  //fantasmas
  push()
    noStroke();
  textFont(fuente);
  textSize(14);
  textAlign(CENTER);
  fill(255); 
  iconX = 10;
  iconY = 120;
  textAlign(LEFT, CENTER);
  image(fantasma, iconX, iconY - 1, 20, 20); 
  text(":" + contadorFantasmas, iconX + 24, iconY + 11);
  pop()
  // estrella que cae
  noStroke();
  //fill(random(255), random(255), random(255));
  //circle(posX, posY, dropR * 3);
  image(estrellita, posX, posY);
  posY += speedY * velocidad;

  // fantasma más chico
  image(
    fantasma,
    ghostX,
    ghostY,
    fantasma.width * GHOST_SCALE,
    fantasma.height * GHOST_SCALE
  );
  ghostY += ghostSpeedY;

  // respawn si salió de pantalla
  if (posY > height) {
    posY = 0;
    posX = random(50, width - 70);
  }

  if (ghostY > height) {
    ghostY = 0;
    ghostX = random(50, width - 70);
  }

  // red entre pulgar e índice
  if (hands.length > 0) {
    const h = hands[0];
    const { thumb, index } = getTips(h);

    // suavizar posiciones (menos jitter)
    const tS = smoothTo(thumb, smThumb, 0.5);
    const iS = smoothTo(index, smIndex, 0.5);

    // dibujar red
    const netW = 10; // grosor
    stroke("pink");
    strokeWeight(netW);
    line(tS.x, tS.y, iS.x, iS.y);

    //colicion de la estrella
    const cx = posX + estrellita.width * 0.5; // centro X estrella
    const cy = posY + estrellita.height * 0.5; // centro Y estrella
    const starR = Math.max(estrellita.width, estrellita.height) * 0.5;

    const dStar = pointSegDist(cx, cy, tS.x, tS.y, iS.x, iS.y);
    if (dStar < netW * 0.5 + starR * 0.45) {
      posY = 0;
      posX = random(50, width - 70);
      velocidad += 0.2;
      puntaje += sumaPuntos;
      contadorEstrellas++;

      if (puntaje > 0) {
        mostrarLose = false;
        mostrarWin = false;
      }
      if (puntaje >= 10) {
        mostrarWin = true;
        puntaje = 0;
        velocidad = 1;
      }
    }

    //colision del fantasma
    const gW = fantasma.width * GHOST_SCALE; // ancho escalado
    const gH = fantasma.height * GHOST_SCALE; // alto escalado
    const gcx = ghostX + gW * 0.5; // centro X fantasma
    const gcy = ghostY + gH * 0.5; // centro Y fantasma
    const gR = Math.max(gW, gH) * 0.5; // radio aprox

    const dGhost = pointSegDist(gcx, gcy, tS.x, tS.y, iS.x, iS.y);
    if (dGhost < netW * 0.5 + gR * 0.45) {
      // respawn fantasma
      ghostY = 0; //
      ghostX = random(50, width - 70);
      //cada captura lo hace caer más lento (mínimo 1)
      ghostSpeedY = max(1, ghostSpeedY - 0.5);
      puntaje -= restaPuntos;
      contadorFantasmas++;
      if(puntaje === 0 ){
        contadorFantasmas = 0;
      }
      if (puntaje <= 0) {
        ghostSpeedY = 7;
        push();
        textFont(fuente);
        text("you loose", width / 2, height / 2);
        pop();
        puntaje = 0;
        mostrarLose = true;
        mostrarWin = false;
      }
    }

    if (mostrarLose) {
      push();
      noStroke();
      fill("yellow");
      textAlign(CENTER, CENTER);
      textFont(fuente);
      textSize(50);
      text("you loose", width / 2, height / 2);
      pop();
      contadorEstrellas = 0;
      contadorFantasmas = 0;
    }

    if (mostrarWin) {
      push();
      noStroke();
      fill("yellow");
      textAlign(CENTER, CENTER);
      textFont(fuente);
      textSize(50);
      text("you win", width / 2, height / 2);
      pop();
      contadorEstrellas = 0;
      contadorFantasmas = 0
    }

    /* // (opcional) tips visibles
noStroke();
fill(255, 0, 0);   circle(iS.x, iS.y, 12);   // índice
fill(0, 120, 255); circle(tS.x, tS.y, 12);   // pulgar
*/
  }
}

// obtener tips por nombre (API v1.x usa .name)
function getTips(hand) {
  let thumb = null,
    index = null;
  for (let kp of hand.keypoints) {
    if (kp.name === "thumb_tip") thumb = kp;
    if (kp.name === "index_finger_tip") index = kp;
  }
  return { thumb, index };
}

// suavizado exponencial simple
function smoothTo(target, sm, alpha = 0.6) {
  if (!sm.ready) {
    sm.x = target.x;
    sm.y = target.y;
    sm.ready = true;
  }
  sm.x = lerp(sm.x, target.x, alpha);
  sm.y = lerp(sm.y, target.y, alpha);
  return sm;
}

// distancia punto–segmento (para la "red")
function pointSegDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax,
    vy = by - ay;
  const wx = px - ax,
    wy = py - ay;
  const c1 = vx * wx + vy * wy;
  const c2 = vx * vx + vy * vy;
  let t = 0;
  if (c2 > 0) t = constrain(c1 / c2, 0, 1);
  const qx = ax + t * vx,
    qy = ay + t * vy; // proyección en el segmento
  const dx = px - qx,
    dy = py - qy;
  return Math.sqrt(dx * dx + dy * dy);
}

function gotHands(results) {
  hands = results;
}
/*falta agregar cantidad de estrellas y fantasmas que se colectaron
temporizador para aumentar dificultad
desarrolas mas la interfaz*/
