import Visualizer from './classes/visualizer'
import { interpolateRgb, interpolateBasis, interpolateArray } from 'd3-interpolate'
import { sin, circle } from './util/canvas'
import { getRandomElement } from './util/array'
import * as d3 from 'd3'

export default class Template extends Visualizer {
  constructor () {
    super({ volumeSmoothing: 20 })
    this.theme = ['#D63230', '#F39237', '#40BCD8', '#39A9DB', '#1C77C3'] // pride template
    this.timbreArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.pitchArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    window.addEventListener('keyup', event => {
      this.handleKeyPress(event)
    })
  }

  hooks () {
    const ctx = this.sketch.ctx
    const width = this.sketch.width
    const height = this.sketch.height

    this.sync.on('tatum', tatum => {
      // ctx.fillStyle = 'rgba(0, 0, 0, .2)'
      // ctx.fillRect(0, 0, width, height)
    })

    this.sync.on('segment', segment => {
      this.timbreArray = interpolateArray(this.timbreArray, segment.timbre)(.5)
      this.pitchArray = interpolateArray(this.pitchArray, segment.pitches)(.5)
    })

    this.sync.on('beat', beat => {
      const bar = interpolateBasis([0, this.sync.volume * 10, 0])(this.sync.bar.progress)

      let lineWidth = bar * 20 + 30
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = this.lastColor
      ctx.fillStyle = 'rgba(255, 255, 255, .4)'
      ctx.beginPath()
      ctx.lineWidth = beat

      let circle_radius = this.sync.volume * height / 10
      if (circle_radius < 50) {
        circle_radius = 0
      }
      circle(ctx, width / 2, height / 2, circle_radius)
      ctx.stroke()
      ctx.fill()
    })

    this.sync.on('bar', bar => {
      this.lastColor = this.nextColor || getRandomElement(this.theme)
      this.nextColor = getRandomElement(this.theme.filter(color => color !== this.nextColor))
    })

    this.sync.on('section', section => {
      // console.log(section)
    })
  }

  paint({ ctx, height, width, now }) {
    const bar = interpolateBasis([0, this.sync.volume * 10, 0])(this.sync.bar.progress)
    const beat = interpolateBasis([0, this.sync.volume * 300, 0])(this.sync.beat.progress)

    // Fade the previous animation with a black box
    ctx.fillStyle = 'rgba(0, 0, 0, .08)'
    ctx.fillRect(0, 0, width, height)


    ctx.lineWidth = 2;
    var x1 = width / 2,
      y1 = height / 2,
      x0 = x1,
      y0 = y1,
      i = 0,
      r = (width / 3 - (this.sync.volume / 80 * width / 2)),
      τ = 2 * Math.PI;
    var z = d3.hsl(++i % 360, 1, .5).rgb(),
      c = interpolateRgb(this.lastColor, this.nextColor)(this.sync.bar.progress),
      x = x0 += (x1 - x0) * .1,
      y = y0 += (y1 - y0) * .1;

    d3.select({}).transition()
      .duration(4000)
      .ease(Math.sqrt)
      .tween("circle", function () {
        return function (t) {
          ctx.strokeStyle = c;
          ctx.beginPath();
          ctx.arc(x, y, r * t, 0, τ);
          ctx.stroke();
        };
      });


    // Create a sine wave
    ctx.lineWidth = bar
    ctx.strokeStyle = interpolateRgb(this.lastColor, this.nextColor)(this.sync.bar.progress)
    sin(ctx, now / 50, height / 2, this.sync.volume * 100, 100)
    ctx.stroke()

    // Create a circle in the center
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.beginPath()
    ctx.lineWidth = beat
    circle(ctx, width / 2, height / 2, this.sync.volume * height / 30 + beat / 10)
    ctx.stroke()
    ctx.fill()

    // ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    // const rectWidth = width / this.timbreArray.length
    // // this.timbreArray.forEach((timbreValue, i) => {

    // //   ctx.fillRect(rectWidth * i, height / 2, rectWidth, (timbreValue / 200 * height))
    // // })

    // this.pitchArray.forEach((pitchValue, i) => {
    //   ctx.fillRect(rectWidth * i, height, rectWidth, -(pitchValue * height))
    // })
  }



  handleKeyPress(event) {
    console.log(event.keyCode)
    switch (event.keyCode) {
      case 70: // f
        console.log("fullscreen")
        this.openFullscreen()
        break
      default:
        break
    }
  }

  /* View in fullscreen */
  openFullscreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();
    }
  }

  /* Close fullscreen */
  closeFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  }
}