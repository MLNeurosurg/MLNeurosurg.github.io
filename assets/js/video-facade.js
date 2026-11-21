// Click-to-play YouTube embeds with a custom cover image.
// Markup: <a class="video-facade" href="https://www.youtube.com/watch?v=ID&t=Ns"
//            data-youtube-id="ID" data-start="N" data-title="...">
//           <img src="cover.jpg" alt="..."></a>
// Without JS the link simply opens YouTube at the start time.
document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('a.video-facade');
  if (!link) return;
  e.preventDefault();
  var params = 'autoplay=1&rel=0';
  if (link.dataset.start) params += '&start=' + encodeURIComponent(link.dataset.start);
  var iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(link.dataset.youtubeId) + '?' + params;
  iframe.title = link.dataset.title || 'YouTube video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  link.replaceWith(iframe);
});
