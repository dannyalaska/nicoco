$(document).ready(function(){
  console.log('loaded');
  $('#logogif').hover(function(){
    $(this).effect('shake', {distance:3}, 200);
  });
});
