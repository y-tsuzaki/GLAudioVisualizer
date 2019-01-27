
$(window).on('load', () => {
// $( () => {
  // $('audio').on('canplay', () => {
    let visualizer = new GLAudioVisualizer.GLAudioVisualizer($('#canvas-wrapper')[0]);
    visualizer.init();

      let audioController = visualizer.audioController;
      $('.play-button').on('click', () => {
        if (!audioController.canPlay) {
          alert('ロードが終わっていない可能性があります。しばらくお待ちください');
          return;
        }
        if (!audioController.isPlaying) {
          audioController.resume();
          $('.play-button-play').hide();
          $('.play-button-pause').show();
        } else {
          audioController.pause();
          $('.play-button-play').show();
          $('.play-button-pause').hide();
        }
      });
      audioController.onended = () => {
        $('.play-button-play').show();
        $('.play-button-pause').hide();
      };

      setInterval( () => {
        let current = audioController.currentTime;
        let currentText = Math.floor(current / 60) + ':' + pad(Math.floor(current % 60).toString(), 2);
        if ( isNaN(current) ) {
          currentText = '0:00';
        }
        $('.playback-timeline-time-passed > span').text(currentText);

        let duration = audioController.duration;
        let durationText = Math.floor(duration / 60) + ':' + pad(Math.floor(duration % 60).toString(), 2);
        if ( isNaN(duration) ) {
          durationText = '0:00';
        }
        $('.playback-timeline-time-dulation > span').text(durationText);
      }, 200);
      setInterval( () => {
        if (!timelineChanging) {
          let current = audioController.currentTime;
          let duration = audioController.duration;
          if (duration === 0) {
            $('input[name="playback-timeline"]').val(0);
          } else {
            $('input[name="playback-timeline"]').val(current / duration);
          }
        }
      }, 1000);
      let timelineChanging = false;
      $('input[name="playback-timeline"]').on('mousedown touchstart', () => {
        timelineChanging = true;
      });
      $('input[name="playback-timeline"]').on('mouseup touchend touchcancel', () => {
        timelineChanging = false;
      });

      audioController.volume = 0.5;
      $('input[name="volume"]').on('input', () => {
        audioController.volume = Number($('input[name="volume"]').val());
      });

      $('input[name="playback-timeline"]').on('change', () => {
        let val = Number($('input[name="playback-timeline"]').val());
        let d = audioController.duration;

        audioController.currentTime = d * val;
      });
  });
// });

  function pad(n: string, width: number, z?: string): string {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

