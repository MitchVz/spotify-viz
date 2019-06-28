import Visualizer from './classes/visualizer'
import { interpolateRgb, interpolateBasis, interpolateArray } from 'd3-interpolate'
import { sin, circle } from './util/canvas'
import { getRandomElement } from './util/array'
import * as d3 from 'd3'

export default class Template extends Visualizer {

  constructor () {
    super({ volumeSmoothing: 20 })

    this.allThemes = [
      // pride template
      ['#D63230', '#F39237', '#40BCD8', '#39A9DB', '#1C77C3'],

      // Deep colors
      ['#910024', '#8c1a7b', '#041f99', '#0d8dad', '#c17a5e'],

      // blues and purples
      ['#f7f4ea', '#ded9e2', '#c0b9dd', '#75c9c8', '#8980f5'],

      // bright colors
      ['#1be7ff', '#6eeb83', '#ffb800', '#e5f900', '#ff5714'],

      // justworks colors
      ['#39B6E9', '#37B375', '#645187', '#EC5453', '#FBFDBF']
    ]
    this.themeIndex = 0
    this.theme = this.allThemes[this.themeIndex]
    this.timbreArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.pitchArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    // show toggles
    this.showSine = true
    this.showCircles = true
    this.showBeats = true

    this.ctx = this.sketch.ctx
    this.width = this.sketch.width
    this.height = this.sketch.height

    window.addEventListener('keyup', event => {
      this.handleKeyPress(event)
    })
  }

  hooks () {

    this.sync.on('tatum', tatum => {
      // ctx.fillStyle = 'rgba(0, 0, 0, .2)'
      // ctx.fillRect(0, 0, width, height)
    })

    this.sync.on('segment', segment => {
      // this.timbreArray = interpolateArray(this.timbreArray, segment.timbre)(.5)
      // this.pitchArray = interpolateArray(this.pitchArray, segment.pitches)(.5)
    })

    this.sync.on('beat', beat => {
      let ctx = this.ctx
      let height = this.height
      let width = this.width

      if (this.showBeats) {
        const bar = interpolateBasis([0, this.sync.volume * 10, 0])(this.sync.bar.progress)

        let lineWidth = bar * 20 + 30
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = this.lastColor
        ctx.fillStyle = 'rgba(255, 255, 255, .4)'
        ctx.beginPath()
        ctx.lineWidth = beat

        let circle_radius = this.sync.volume * height / 10
        if (circle_radius < 20) {
          circle_radius = 0
        }
        circle(ctx, width / 2, height / 2, circle_radius)
        ctx.stroke()
        ctx.fill()
      }
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
    this.height = height
    this.width = width
    const bar = interpolateBasis([0, this.sync.volume * 10, 0])(this.sync.bar.progress)
    const beat = interpolateBasis([0, this.sync.volume * 300, 0])(this.sync.beat.progress)

    // Fade the previous animation with a black box
    ctx.fillStyle = 'rgba(0, 0, 0, .08)'
    ctx.fillRect(0, 0, width, height)

    if (this.showCircles) {
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
    }

    if (this.showSine) {
      // Create a sine wave
      ctx.lineWidth = bar
      ctx.strokeStyle = interpolateRgb(this.lastColor, this.nextColor)(this.sync.bar.progress)
      sin(ctx, now / 50, height / 2, this.sync.volume * 100, 100)
      ctx.stroke()

      // Create a circle in the center
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'
      ctx.beginPath()
      ctx.lineWidth = beat
      // circle(ctx, width / 2, height / 2, this.sync.volume * height / 30 + beat / 10)
      ctx.stroke()
      ctx.fill()
    }

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
      case 37: // left arrow
        this.changeTheme(-1)
        break
      case 39: // right arrow
        this.changeTheme(1)
        break
      case 83: // s
        this.toggleSine()
        break
      case 67: // c
        this.toggleCircles()
        break
      case 66: // b
        this.toggleBeat()
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

  changeTheme(value) {
    this.themeIndex += value
    if (this.themeIndex < 0) {
      this.themeIndex = this.allThemes.length - 1
    } else if (this.themeIndex > this.allThemes.length - 1) {
      this.themeIndex = 0
    }

    console.log(`new theme: ${this.themeIndex}`)
    this.theme = this.allThemes[this.themeIndex]
  }

  toggleBeat() {
    this.showBeats = !this.showBeats
  }

  toggleCircles() {
    this.showCircles = !this.showCircles
  }

  toggleSine() {
    this.showSine = !this.showSine
  }
}