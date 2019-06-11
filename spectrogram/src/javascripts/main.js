'use strict';

window.isMobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );
window.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
window.isAndroid = /Android/.test(navigator.userAgent) && !window.MSStream;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

const throwIOSError = () => {
  // Throw Microphone Error
  window.parent.postMessage('error2', '*');
};

// -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~
var spec3D = require('./UI/spectrogram');
// -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~

var locale = require('./util/locale');

$(() => {

  // locale.getLocalization();

  const BUTTON = '.music-box__buttons__button';

  const startup = () => {

    var source = null; // global source for user dropped audio
    window.parent.postMessage('ready', '*');

    var sp = spec3D;

    // *** .attached *** //
    sp.attached();
    // ***************** //

    // --------------------------------------------
    $('.music-box__tool-tip').hide(0);
    $('#loadingSound').hide(0);

    $(BUTTON).click(e => {

      var $clickedButton = $(e.currentTarget);

      // *** .startRender *** //
      sp.startRender();
      // ******************** //

      var wasPlaying = sp.isPlaying();

      // *** .stop *** //
      sp.stop();
      // ************* //

      sp.drawingMode = false;
      
      $(BUTTON).removeClass('selected');

      if( $clickedButton.hasClass('selected') ) {
        return;
      }
      
      $clickedButton.addClass('selected');
      
      var isMicMode = $clickedButton.attr('data-mic') !== undefined;
      var isDrawingMode = $clickedButton.attr('data-draw') !== undefined;
      var isSourceMode = $clickedButton.attr('data-src') !== undefined;

      // Check for start recoding data instruction
      if (isMicMode) {
        if (window.isIOS) {
          throwIOSError();
          $clickedButton.removeClass('selected');
          return;
        }
        // Show recording icon
        $('#record').fadeIn().delay(2000).fadeOut();
        // Start recording
        
        // *** .live *** //
        sp.live();
        // ************* //

        return;
      }

      if (isDrawingMode) {
        // ***************** //
        sp.drawingMode = true;
        // ***************** //
        $('#drawAnywhere').fadeIn().delay(2000).fadeOut();
        return;
      }

      if (isSourceMode) {
        // ***************** //
        sp.loopChanged( true );
        // ***************** //

        var label = $clickedButton.attr('data-name');
        $('#loadingMessage').text(label);
        var src = $clickedButton.attr('data-src');

        // *** .play *** //
        sp.play(src);
        // ************* //
      }

    }); // onClick
        
    const killSound = () => {
      sp.startRender();
      var wasPlaying = sp.isPlaying();
      sp.stop();
      sp.drawingMode = false;
      $(BUTTON).removeClass('selected'); 
    };

    window.addEventListener('blur', killSound);
    document.addEventListener('visibilitychange', killSound);

    const decodeBuffer = file => {
      // Credit: https://github.com/kylestetz/AudioDrop && 
      // https://ericbidelman.tumblr.com/post/13471195250/web-audio-api-how-to-playing-audio-based-on-user
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();
      // var source = null;
      var audioBuffer = null;
      var fileReader = new FileReader();

      fileReader.onload = fileEvent => {
        var data = fileEvent.target.result;

        context.decodeAudioData(data, buffer => {
          // audioBuffer is global to reuse the decoded audio later.
          audioBuffer = buffer;
          source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = true;
          source.connect(context.destination);

          // Visualizer ******
          // ***************** //
          sp.startRender();
          sp.loopChanged( true );
          sp.userAudio(source);
          // ***************** //

          $('#loadingSound').delay(500).fadeOut().hide(0); // Show icon

        }, error => {
          console.log('Error decoding file', error);
        });

      }; // onFileLoad

      fileReader.readAsArrayBuffer(file);

    }; // decodeBuffer

    const fileDrop = () => {
      var $fileDrop = $('#fileDrop');
      var $description = $('.file-overlay-description');

      $(window).on({
        'dragover': e => {
          e.preventDefault();
          e.stopPropagation();
          $description.text('Drop your sound file here.');
          $fileDrop.addClass('active');
        },
        'dragleave': e => {
          e.preventDefault();
          e.stopPropagation();
          $fileDrop.removeClass('active');
        },
        'drop': e => {
          e.preventDefault();
          e.stopPropagation();
          $fileDrop.addClass('pointer-events');
          // Stop other sounds
          killSound();

          var droppedFiles = e.originalEvent.dataTransfer;
          if (droppedFiles &&
            droppedFiles.files.length &&
            droppedFiles.items[0] &&
            droppedFiles.items[0].type !== 'audio/midi') {

            $.each(droppedFiles.files, (i, file) => {
              if (file.type.indexOf('audio') > -1) {
                $('#loadingMessage').text(file.name);
                $('#loadingSound').show(0);
                decodeBuffer(file);
                $fileDrop.removeClass('active');
                $fileDrop.removeClass('pointer-events');
              } else {
                $description.text('Only sound files will work here.');
              }
            });

          } else {
            $description.text('Only sound files will work here.');
          }
        }
      }); // Add listeners

      $fileDrop.on('click', () => {
        $fileDrop.removeClass('active');
        $fileDrop.removeClass('pointer-events');
      });
    }; // fileDrop

    fileDrop();

  }; // startup

  var elm = $('#iosButton');

  if (!window.isIOS) {
    elm.addClass('hide');
    startup();
    console.log(2);
  } else {
    window.parent.postMessage('loaded', '*');
    elm[0].addEventListener('touchend', () => {
      elm.addClass('hide');
      startup();
    }, false);
  }

});
