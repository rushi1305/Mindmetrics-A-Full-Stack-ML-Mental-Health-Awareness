(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);
    
    
    // Initiate the wowjs
    new WOW().init();
    
    
   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Modal Video
    $(document).ready(function () {
        var $videoSrc;
        $('.btn-play').click(function () {
            $videoSrc = $(this).data("src");
        });
        console.log($videoSrc);

        $('#videoModal').on('shown.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
        })

        $('#videoModal').on('hide.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc);
        })
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });
    

    // Testimonial carousel
    $(document).ready(function(){
      // Initialize the owl carousel
      $(".testimonial-carousel-1").owlCarousel({
          autoplay: true,
          smartSpeed: 1000,
          margin: 25,
          loop: true,
          center: true,
          dots: false,
          nav: true,
          navText : [
              '<i class="bi bi-chevron-left"></i>',
              '<i class="bi bi-chevron-right"></i>'
          ],
          responsive: {
              0:{
                  items:1
              },
              768:{
                  items:2
              },
              992:{
                  items:3
              }
          }
      });
  });
  
});
(jQuery);
function line(ctx, x1, y1, x2, y2) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  function bar(ctx, fcolor, scolor, lwidth, x, y, w, h) {
    ctx.fillStyle = fcolor;
    ctx.lineWidth = lwidth;
    ctx.strokeStyle = scolor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
  
  var cube3d = function() {
    this.canvas = "";
    this.ctx = "";
    this.size = 2;
    this.sides = {
      red: "rrrrrrrrr",
      orange: "ooooooooo",
      blue: "bbbbbbbbb",
      green: "ggggggggg",
      white: "wwwwwwwww",
      yellow: "yyyyyyyyy"
    };
    this.colors = {
      o: "orange",
      r: "red",
      w: "white",
      b: "blue",
      g: "green",
      y: "yellow"
    };
    var Pi180 = Math.PI / 180;
    this.FRONT = 0;
    this.TOP = 1;
    this.RIGHT = 2;
    this.LEFT = 3;
    this.UP = 4;
    this.DOWN = 5;
    this.BACK = 6;
    this.Width = 0;
    this.Height = 0;
  
    this.tsin = Array(360);
    this.tcos = Array(360);
    this.R_N = 0;
    this.R_X = 1;
    this.R_Y = 2;
    this.R_Z = 3;
  
    this.init = function(cv, sz) {
      if (typeof cv !== "undefined") {
        if (typeof cv === "string") cv = $(cv)[0];
        this.ctx = cv.getContext("2d");
        this.canvas = cv;
        this.Width = cv.width;
        this.Height = cv.height;
        if (typeof sz === "undefined") sz = 3;
        if (sz < 2) sz = 2;
        this.size = sz;
        /*$(cv).on( "mousedown", this.mousedown);
          $(cv).on( "mouseup", this.mouseup);
          $(cv).on( "touchstart", this.touchstart);
          $(cv).on( "touchend", this.touchend);*/
      }
  
      this.sides["red"] = "rrrrrrrrr";
      this.sides["orange"] = "ooooooooo";
      this.sides["blue"] = "bbbbbbbbb";
      this.sides["green"] = "ggggggggg";
      this.sides["white"] = "wwwwwwwww";
      this.sides["yellow"] = "yyyyyyyyy";
  
      for (var i = 0; i < 360; i++) {
        this.tsin[i] = Math.sin(i * Pi180);
        this.tcos[i] = Math.cos(i * Pi180);
      }
  
      var s = this.size;
      var ss = s * s;
      
      this.rot_cubies = [];
      this.rotSidePos = {
        F: { pos: [], axis: this.R_Z },
        B: { pos: [], axis: this.R_Z },
        R: { pos: [], axis: this.R_X },
        L: { pos: [], axis: this.R_X },
        U: { pos: [], axis: this.R_Y },
        D: { pos: [], axis: this.R_Y },
        S: { pos: [], axis: this.R_Z },
        E: { pos: [], axis: this.R_X },
        M: { pos: [], axis: this.R_Y }
      };
      for (var i = 0; i < ss; i++) this.rotSidePos["F"].pos.push(i); //front
      for (var i = 0; i < ss; i++) this.rotSidePos["B"].pos.push(i + ss * (s - 1)); //back
      for (var j = 0; j < s; j++)
        for (var i = 0; i < s; i++)
          this.rotSidePos["U"].pos.push(i + j * ss); //up
      for (var j = 0; j < s; j++)
        for (var i = 0; i < s; i++)
          this.rotSidePos["D"].pos.push( s * (s - 1) + i + j * ss); //down
      
      for (var i = 0; i < s; i++) {  
        this.rotSidePos["L"].pos.push(ss * i);//left
        this.rotSidePos["L"].pos.push(ss * i + s * (s - 1));
      }
      for (var j = 0; j < s; j++)
        for (var i = s; i < s + s - 2; i++)
          this.rotSidePos["L"].pos.push(i + ss * j); //left
      for (var i = 0; i < s; i++) {
        //right
        this.rotSidePos["R"].pos.push(ss * i + s - 1);
        this.rotSidePos["R"].pos.push(ss * i + ss - 1); //s*(s-1)+s-1
      }
      for (var j = 0; j < s; j++)
        for (var i = s + s - 2; i < s + s - 2 + s - 2; i++)
          this.rotSidePos["R"].pos.push(i + ss * j); //right
    };
    this.getRotCubies = function(axis, layer){ // f,u,l = 0
      var s = this.size;
      var ss = s * s;
      var offset;
      this.rot_cubies=[];
      switch(axis){
        case this.R_X: // R, L, M
           /*for (var i = 0; i < s; i++) {    
              this.rotSidePos["R"].pos.push(ss * i + layer);
              this.rotSidePos["R"].pos.push(ss * i + ss - 1); 
           }
          for (var j = 0; j < s; j++)
          for (var i = s + layer - 1; i < s + 2*(layer-1); i++)
              this.rotSidePos["R"].pos.push(i + ss * j); 
          */
          offset = ss + layer;
          for(var j = 0; j < s; j++){
              for(var i = 0; i < s; i++)
                  this.rot_cubies.push(offset - (i + 1) * s);
              offset += s;
          }
          break;
        case this.R_Y: // U, D, E
          offset =  s * layer;
          for (var j = 0; j < s; j++)
          for (var i = 0; i < s; i++)
            this.rot_cubies.push( i + j * ss + offset);
          break;
        case this.R_Z: // F, B, S
          offset =  ss * layer;
          for (var i = 0; i < ss; i++)
            this.rot_cubies.push(i + offset)
          break;        
      }
    }
    //поворот объекта в 3d с перспективой относительно центра.
    this.rotate3d_x = function(p, a) {
      var py = p.y;
      var pz = p.z;
      //a = a * Pi180;
      //var sa = Math.sin(a);
      //var ca = Math.cos(a);
      var sa = this.tsin[a];
      var ca = this.tcos[a];
      p.y = py * ca - pz * sa;
      p.z = py * sa + pz * ca;
    };
    this.rotate3d_y = function(p, a) {
      //a = a * Pi180;
      var px = p.x;
      var pz = p.z;
      //var sa = Math.sin(a);
      //var ca = Math.cos(a);
      var sa = this.tsin[a];
      var ca = this.tcos[a];
      p.x = px * ca + pz * sa; //this.tsin[a];
      p.z = -px * sa + pz * ca;
    };
    this.rotate3d_z = function(p, a) {
      //a = a * Pi180;
      var px = p.x;
      var py = p.y;
      //var sa = Math.sin(a), ca = Math.cos(a);
      var sa = this.tsin[a];
      var ca = this.tcos[a];
      p.x = px * ca - py * sa;
      p.y = px * sa + py * ca;
    };
    this.rotate3d = function(pts, angle) {
      var i;
      for (i = 0; i < pts.length; i++) {
        var p = pts[i];
        //{ вокpуг оси X }
        if (angle.x) this.rotate3d_x(p, angle.x);
        //{ вокpуг оси Y }
        if (angle.y) this.rotate3d_y(p, angle.y);
        //{ вокpуг оси Z }
        if (angle.z) this.rotate3d_z(p, angle.z);
      }
    };
    this.viewDistance = 1500;
    this.scale = 1.9;
    this.cam = { x: 0, y: 0, z: 0 };
    this.cubeRot = { x: 360 - 35, y: 40, z: 360 - 25 };
    this.pbuf = Array();
    this.project = function(pts) {
      var z;
      for (var i = 0; i < pts.length; i++) {
        z = pts[i].z - this.viewDistance;
        z = this.viewDistance / z;
        //console.log(z);
        pts[i].x = this.Width / 2 + pts[i].x * z / this.scale;
        pts[i].y =
          this.Height / 2 -
          pts[i].y * z / this.scale -
          this.Height / (12 * this.scale);
        pts[i].z = Math.floor(pts[i].z);
      }
    };
  
    this.translate3d = function(pts, t) {
      for (var i = 0; i < pts.length; i++) {
        pts[i].x += t.x;
        pts[i].y += t.y;
        pts[i].z += t.z;
      }
    };
    this.bar3d = function(ctx, pts, fcolor, scolor, lwidth) {
      for (var i = 0; i < pts.length; i += 4) {
        ctx.beginPath();
        ctx.fillStyle = fcolor;
        ctx.lineWidth = lwidth;
        ctx.strokeStyle = scolor;
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.lineTo(pts[i + 2].x, pts[i + 2].y);
        ctx.lineTo(pts[i + 3].x, pts[i + 3].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.fill();
      }
    };
  
  
    this.drawplane = function() {};
  
    this.drawtile = function(
      ctx,
      n,
      W,
      H,
      type,
      fcolor,
      scolor,
      lwidth,
      atype,
      angle
    ) {
      if (typeof angle === "undefined") {
        angle = 0;
        atype = this.R_N;
      }
      var ts = 5;
      var tv = this.size * W / 2;
  
      var x = Math.floor(n / this.size) * W - tv;
      var y = Math.floor(n % this.size) * H - tv;
  
      var p = [
        { x: x + ts, y: y + ts, z: 0 },
        { x: x + W - ts, y: y + ts, z: 0 },
        { x: x + W - ts, y: y + H - ts, z: 0 },
        { x: x + ts, y: y + H - ts, z: 0 }
      ];
  
      var trans, angs;
  
      switch (type) {
        case this.FRONT:
          angs = { x: 0, y: 0, z: 0 };
          trans = { x: 0, y: 0, z: tv + ts };
          break;
        case this.UP:
          angs = { x: 90, y: 0, z: 0 };
          trans = { x: 0, y: -tv - ts, z: 0 };
          break;
        case this.DOWN:
          angs = { x: 90, y: 0, z: 0 };
          trans = { x: 0, y: tv + ts, z: 0 };
          break;
        case this.BACK:
          angs = { x: 0, y: 0, z: 0 };
          trans = { x: 0, y: 0, z: -tv - ts };
          break;
        case this.LEFT:
          angs = { x: 0, y: 90, z: 0 };
          trans = { x: tv + ts, y: 0, z: 0 };
          break;
        case this.RIGHT:
          angs = { x: 0, y: 90, z: 0 };
          trans = { x: -tv - ts, y: 0, z: 0 };
          break;
      }
  
      //trans={x:0,y:0,z:0};
      this.rotate3d(p, angs);
      this.translate3d(p, trans);
  
      if (atype != this.R_N) {
        switch (atype) {
          case this.R_X:
            angs = { x: angle, y: 0, z: 0 };
            break;
          case this.R_Y:
            angs = { x: 0, y: angle, z: 0 };
            break;
          case this.R_Z:
            angs = { x: 0, y: 0, z: angle };
            break;
        }
        this.rotate3d(p, angs);
      }
      this.rotate3d(p, this.cubeRot);
      //console.log("b:"+n+" type:"+scolor);
      //for(var i=0;i<4;i++)        //console.log(i+":"+Math.floor(p[i].x)+","+Math.floor(p[i].y)+","+Math.floor(p[i].z));
  
      //for(var i=0;i<4;i++)
      //console.log(i+":"+Math.floor(p[i].x)+","+Math.floor(p[i].y));
  
      this.pbuf.push({ pts: p, color: fcolor });
  
      //this.bar3d(ctx, p, fcolor, scolor, lwidth);
    };
    this.drawside3d = function(ctx, type, W, H, color, rt, atype, angle) {
      W = W / this.size;
      H = H / this.size;
      for (var i = 0; i < this.size * this.size; i++) {
        if (typeof rt === "undefined")
          this.drawtile(ctx, i, W, H, type, color, "black", 1);
        else {
          var r = 0;
          for (var t in rt)
            if (rt[t] == i) {
              r = 1;
              break;
            }
          if (r) {
            this.drawtile(ctx, i, W, H, type, color, "black", 1, atype, angle);
          } else this.drawtile(ctx, i, W, H, type, color, "black", 1);
        }
      }
    };
    this.colors = {
      o: "orange",
      b: "blue",
      r: "red",
      g: "green",
      w: "white",
      y: "yellow",
      "0": "black"
    };
    this.ccube = [
      { x: -1, y: -1, z: -1 },
      { x: 1, y: -1, z: -1 },
      { x: 1, y: 1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 },
      { x: 1, y: -1, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: -1, y: 1, z: 1 }
    ];
    //flbrud
    this.ccube_p = [
      [0, 1, 2, 3],
      [0, 3, 7, 4],
      [4, 5, 6, 7],
      [1, 2, 6, 5],
      [3, 2, 6, 7],
      [0, 1, 5, 4]
    ];
  
    this.drawcube = function(X, Y, Z, W, H, G, color, p, rt, atype, angle) {
      if (typeof angle === "undefined") {
        angle = 0;
        atype = this.R_N;
      }
      var pcube_c = [];
      //Make cube coord
      for (var i = 0; i < 8; i++) {
        pcube_c[i] = Object();
        pcube_c[i].x = X - this.ccube[i].x * W / 2;
        pcube_c[i].y = Y - this.ccube[i].y * H / 2;
        pcube_c[i].z = Z - this.ccube[i].z * G / 2;
      }
  
      if (this.inarr(rt, p)) {
        if (atype != this.R_N) {
          var angs;
          switch (atype) {
            case this.R_X:
              angs = { x: angle, y: 0, z: 0 };
              break;
            case this.R_Y:
              angs = { x: 0, y: angle, z: 0 };
              break;
            case this.R_Z:
              angs = { x: 0, y: 0, z: angle };
              break;
          }
          this.rotate3d(pcube_c, angs);
        }
      }
  
      this.rotate3d(pcube_c, this.cubeRot);
      //Make cube planes
      var p, c;
      for (var i = 0; i < 6; i++) {
        var pcube = [];
        for (var j = 0; j < 4; j++) {
          p = pcube_c[this.ccube_p[i][j]];
          pcube.push({ x: p.x, y: p.y, z: p.z });
        }
        c = this.colors[color[i]];
        //this.project(pcube);
        if (c != "notdraw") this.pbuf.push({ pts: pcube, color: c });
        //this.bar3d(this.ctx, pcube, "black", "red", 1);
      }
    };
  
    this.inarr = function(rt, i) {
      var r = 0;
      for (var t in rt)
        if (rt[t] == i) {
          r = 1;
          break;
        }
      return r;
    };
  
    this.drawlayer3d = function(type, W, H, rtp, angle) {
      var cubedata = [
        [
          /*front:*/ [this.size * this.size, 0, 1][ // count, start, step
            /*left:*/ (this.size, this.size - 1, this.size)
          ],
          /*back:*/ [0],
          /*right:*/ [this.size, 0, this.size],
          /*up:*/ [this.size, this.size * (this.size - 1), 1],
          /*down:*/ [this.size, 0, 1]
        ],
        [
          /*front:*/ [0][/*left:*/ (this.size, this.size - 1 - type, this.size)], // count, start, step
          /*back:*/ [this.size, 0, 1], ///!!!!! 210 543
          /*right:*/ [this.size, type, this.size],
          /*up:*/ [this.size, this.size * (this.size - 1 - type), 1],
          /*down:*/ [this.size, this.size * type, 1]
        ],
        [
          /*front:*/ [0][/*left:*/ (this.size, type, this.size)], // count, start, step
          /*back:*/ [0],
          /*right:*/ [this.size, type, this.size],
          /*up:*/ [this.size, this.size * (this.size - 1), 1],
          /*down:*/ [this.size, 0, 1]
        ]
      ];
  
      var cubePos = [
        //flbrud
        {
          corners: ["go00w0", "g00rw0", "go000y", "g00r0y"], //corners lu, ru, ld, rd
          edges: ["g000w0", "go0000", "g00r00", "g0000y"], // edges u, l, r, d
          centers: "g00000"
        },
        {
          corners: ["0o00w0", "000rw0", "0o000y", "000r0y"], //corners lu, ru, ld, rd
          edges: ["0000w0", "0o0000", "000r00", "00000y"], // edges u, l, r, d
          centers: "000000"
        },
        {
          corners: ["0ob0w0", "00brw0", "0ob00y", "00br0y"], //corners lu, ru, ld, rd
          edges: ["00b0w0", "0ob000", "00br00", "00b00y"], // edges u, l, r, d
          centers: "00b000"
        }
      ];
  
      W = W / this.size;
      H = H / this.size;
  
      var cp = cubePos[type == 0 ? 0 : type == this.size - 1 ? 2 : 1];
      var z, c;
      var sc = (this.size - 1) / 2;
      var sm = (this.size - 3) / 2;
      var Z = W * sc - W * type;
      var ts = 10;
      var Wt = W - ts,
        Ht = H - ts;
      var atype = rtp.axis;
      var rt = rtp.pos;
  
      var p = type * this.size * this.size;
      //draw lu corner
      this.drawcube(
        W * sc,
        -H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[0],
        p,
        rt,
        atype,
        angle
      );
      p++;
      //draw u edge
      if (sm >= 0)
        for (var x = 0; x < this.size - 2; x++) {
          this.drawcube(
            W * sm - W * x,
            -H * sc,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[0],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      //draw ru corner
      this.drawcube(
        -W * sc,
        -H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[1],
        p,
        rt,
        atype,
        angle
      );
      p++;
      //draw l edge
      if (sm >= 0)
        for (var y = 0; y < this.size - 2; y++) {
          this.drawcube(
            W * sc,
            -H * sm + W * y,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[1],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      //draw r edge
      if (sm >= 0)
        for (var y = 0; y < this.size - 2; y++) {
          this.drawcube(
            -W * sc,
            H * sm - W * y,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[2],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      //draw centers
      if (sm >= 0)
        for (var x = 0; x < this.size - 2; x++)
          for (var y = 0; y < this.size - 2; y++) {
            this.drawcube(
              W * sm - W * x,
              -H * sm + W * y,
              Z,
              Wt,
              Ht,
              Wt,
              cp.centers,
              p,
              rt,
              atype,
              angle
            );
            p++;
          }
      //draw ld corner
      this.drawcube(
        W * sc,
        H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[2],
        p,
        rt,
        atype,
        angle
      );
      p++;
      //draw d edge
      if (sm >= 0)
        for (var x = 0; x < this.size - 2; x++) {
          this.drawcube(
            W * sm - W * x,
            H * sc,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[3],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      // draw rd
      this.drawcube(
        -W * sc,
        H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[3],
        p,
        rt,
        atype,
        angle
      );
    };
  
    this.drawlayer3d = function(type, W, H, rtp, angle) {
      var cubedata = [
        [
          /*front:*/ [this.size * this.size, 0, 1][ // count, start, step
            /*left:*/ (this.size, this.size - 1, this.size)
          ],
          /*back:*/ [0],
          /*right:*/ [this.size, 0, this.size],
          /*up:*/ [this.size, this.size * (this.size - 1), 1],
          /*down:*/ [this.size, 0, 1]
        ],
        [
          /*front:*/ [0][/*left:*/ (this.size, this.size - 1 - type, this.size)], // count, start, step
          /*back:*/ [this.size, 0, 1], ///!!!!! 210 543
          /*right:*/ [this.size, type, this.size],
          /*up:*/ [this.size, this.size * (this.size - 1 - type), 1],
          /*down:*/ [this.size, this.size * type, 1]
        ],
        [
          /*front:*/ [0][/*left:*/ (this.size, type, this.size)], // count, start, step
          /*back:*/ [0],
          /*right:*/ [this.size, type, this.size],
          /*up:*/ [this.size, this.size * (this.size - 1), 1],
          /*down:*/ [this.size, 0, 1]
        ]
      ];
  
      var cubePos = [
        //flbrud
        {
          corners: ["go00w0", "g00rw0", "go000y", "g00r0y"], //corners lu, ru, ld, rd
          edges: ["g000w0", "go0000", "g00r00", "g0000y"], // edges u, l, r, d
          centers: "g00000"
        },
        {
          corners: ["0o00w0", "000rw0", "0o000y", "000r0y"], //corners lu, ru, ld, rd
          edges: ["0000w0", "0o0000", "000r00", "00000y"], // edges u, l, r, d
          centers: "000000"
        },
        {
          corners: ["0ob0w0", "00brw0", "0ob00y", "00br0y"], //corners lu, ru, ld, rd
          edges: ["00b0w0", "0ob000", "00br00", "00b00y"], // edges u, l, r, d
          centers: "00b000"
        }
      ];
  
      W = W / this.size;
      H = H / this.size;
  
      var cp = cubePos[type == 0 ? 0 : type == this.size - 1 ? 2 : 1];
      var z, c;
      var sc = (this.size - 1) / 2;
      var sm = (this.size - 3) / 2;
      var Z = W * sc - W * type;
      var ts = 10;
      var Wt = W - ts,
        Ht = H - ts;
      var atype = rtp.axis;
      var rt = rtp.pos;
  
      var p = type * this.size * this.size;
      //draw lu corner
      this.drawcube(
        W * sc,
        -H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[0],
        p,
        rt,
        atype,
        angle
      );
      p++;
      //draw u edge
      if (sm >= 0)
        for (var x = 0; x < this.size - 2; x++) {
          this.drawcube(
            W * sm - W * x,
            -H * sc,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[0],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      //draw ru corner
      this.drawcube(
        -W * sc,
        -H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[1],
        p,
        rt,
        atype,
        angle
      );
      p++;
      //draw l edge
      if (sm >= 0)
        for (var y = 0; y < this.size - 2; y++) {
          this.drawcube(
            W * sc,
            -H * sm + W * y,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[1],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      //draw r edge
      if (sm >= 0)
        for (var y = 0; y < this.size - 2; y++) {
          this.drawcube(
            -W * sc,
            H * sm - W * y,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[2],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      //draw centers
      if (sm >= 0)
        for (var x = 0; x < this.size - 2; x++)
          for (var y = 0; y < this.size - 2; y++) {
            this.drawcube(
              W * sm - W * x,
              -H * sm + W * y,
              Z,
              Wt,
              Ht,
              Wt,
              cp.centers,
              p,
              rt,
              atype,
              angle
            );
            p++;
          }
      //draw ld corner
      this.drawcube(
        W * sc,
        H * sc,
        Z,
        Wt,
        Ht,
        Wt,
        cp.corners[2],
        p,
        rt,
        atype,
        angle
      );
      p++;
      //draw d edge
      if (sm >= 0)
        for (var x = 0; x < this.size - 2; x++) {
          this.drawcube(
            W * sm - W * x,
            H * sc,
            Z,
            Wt,
            Ht,
            Wt,
            cp.edges[3],
            p,
            rt,
            atype,
            angle
          );
          p++;
        }
      // draw rd
      this.drawcube(
        -W * sc, H * sc, Z,
        Wt, Ht, Wt,
        cp.corners[3],
        p,
        rt,
        atype,
        angle
      );
    };
    
    this.drawCube = function(W, H, rt, angle) {
      for (var i = 0; i < this.size ; i++)
        this.drawlayer3d(i, this.Width, this.Height, this.rotSidePos[rt], angle);
    };
  
    /*****DRAW****/
    this.draw = function(par) {
      var cv, a, ts, size, layer;
      var angle = 0;
      ts = 10;
      size = this.size;
      if (typeof par === "undefined" || par == null) {
        return;
      } else {
        if ("ts" in par) ts = par.ts;
        if ("size" in par) size = par.size;
        if ("angle" in par) angle = par.angle;
        if ("layer" in par) layer = par.layer;
      }
  
      this.drawCube(this.Width, this.Height, layer, angle);
  
      //z-sort
      this.pbuf.sort(this.sortfunc);
  
      this.ctx.clearRect(0, 0, this.Width, this.Height);
      this.ctx.globalAlpha = 0.65;
      //project
      for (var i in this.pbuf) {
        this.project(this.pbuf[i].pts);
        this.bar3d(this.ctx, this.pbuf[i].pts, this.pbuf[i].color, "black", 0.5);
      }
      this.pbuf = [];
    };
  
    /****Sort****/
    this.sortfunc = function(a, b) {
      var p1 = a.pts,
        p2 = b.pts,
        pa = { x: 0, z: 0, y: 0 },
        pb = { x: 0, z: 0, y: 0 },
        da = [],
        db = [];
  
      if (typeof a.dist === "undefined" || typeof b.dist === "undefined") {
        a.dist = [];
        b.dist = [];
        for (var i = 0; i < 4; i++) {
          da = Math.sqrt(
            p1[i].x * p1[i].x +
              p1[i].y * p1[i].y +
              (p1[i].z - 2000) * (p1[i].z - 2000)
          );
          db = Math.sqrt(
            p2[i].x * p2[i].x +
              p2[i].y * p2[i].y +
              (p2[i].z - 2000) * (p2[i].z - 2000)
          );
          // sqrt(d) not needed
          a.dist[i] = da;
          b.dist[i] = db;
        }
      }
      var aa = 0,
        bb = 0;
      for (var i = 0; i < 4; i++) {
        aa += a.dist[i];
        bb += b.dist[i];
      }
      return bb - aa;
    };
  };
  
  var ti;
  
  angl = 0;
  var ry = 0;
  var rz = 0;
  function drawCube() {
    cube.cubeRot.y = ry;
    //cube.cubeRot.z = rz;
    cube.draw({ angle: rz, layer: "U" });
  
    angl += 2;
    ry += 2;
    rz += 1;
    if (angl >= 358) angl = 0;
    if (rz >= 358) rz = 0;
    if (ry >= 358) ry = 0;
  }
  var ri;
  var cube = new cube3d();
  cube.init("#cubecv", 3); //Math.ceil(Math.random() * 5));
  cube.draw();
  setInterval(drawCube, 50);

//timeline.css
var $element=$('.each-event, .title');
var $window = $(window);
$window.on('scroll resize', check_for_fade);
$window.trigger('scroll');
function check_for_fade() { 
    var window_height = $window.height();
    
    $.each($element, function (event) {
        var $element = $(this);
        var element_height = $element.outerHeight();
        var element_offset = $element.offset().top;
        space = window_height - (element_height + element_offset -$(window).scrollTop());
        if (space < 60) {
            $element.addClass("non-focus");
        } else {
            $element.removeClass("non-focus");
        }
 
    });
};

