function openShare(title, url){
    if (navigator.share) {
            navigator.share({
                title: title,
                url: url
        }).then(() => {
            console.log('Thanks for sharing!');
        })
    .catch(console.error);
    } else {
        shareDialog.classList.add('is-open');
    }
}

// 위에서 then 이후에 뭐 창을 닫는다던지, 이후의 상황에 대해서 나중에 필요하면 대비할 필요는 있음.