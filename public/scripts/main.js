document.onreadystatechange = function() { 
    if (document.readyState !== "complete") { 
        document.querySelector("body").style.visibility = "hidden"; 
        document.querySelector("#loaderit").style.visibility = "visible"; 
    }else { 
        document.querySelector("#loaderit").style.display = "none"; 
        document.querySelector("body").style.visibility = "visible"; 
    } 
};