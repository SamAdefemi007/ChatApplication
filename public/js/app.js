communityList = [
  "General",
  "React",
  "TypeScript",
  "Java",
  "Python",
  "Ruby",
  "C#",
  "C++",
  "NewBies",
  "Open-Source",
];

//Using Jquery to handle Index Page interactivity
$(document).ready(function () {
  // show box shadow when user scrolls down
  const scrollHeader = () => {
    if (window.scrollY > 100) {
      $("#header").addClass("header-scrolled");
    } else {
      $("#header").removeClass("header-scrolled");
    }
  };
  $(window).on("load", scrollHeader);
  $(document).on("scroll", scrollHeader);

  // Making the list of the communities dynamic
  communityList.map((opt) => {
    return $("#community").append(`<option value="${opt}">${opt}</option>`);
  });

  //offsetting height after scrolling

  $(".join-chat").click((e) => {
    e.preventDefault();
    console.log($("#communitySection"));
    $("html, body").animate(
      {
        scrollTop: $("#communitySection").offset().top - 140,
      },
      100
    );
    $("button.navbar-toggler").click();
  });
});
