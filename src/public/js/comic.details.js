/*************** Function ***************/
window.showInput = function (e) {
    $thisbtnbox = $(e).parents('.form-group').siblings('#buttonbox')
    $thisbtnbox.addClass('buttonbox--flex');
}

window.resetInput = function (e) {
    $thisbtnbox = $(e).parents('.buttonbox')
    $thisbtnbox.removeClass('buttonbox--flex');
    $(e).parents('form').trigger("reset");
}

window.hideReplydialog = function (e) {
    $thisreplydialog = $(e).parents('.replydialog')
    $thisreplydialog.toggleClass('d-none');
}

window.showReplyBox = function (e) {
    $thisreplybox = $(e).parents('.toolbar').siblings('#replydialog')
    $thisreplybox.toggleClass('d-none');
}


window.expander = function (e) {
    $thisExpander = $(e)
    var $thisExpanderReplies = $(e).parents('.comment').siblings('.expander__content')
    var $thisLessRepliesbtn = $(e).children('.expander__less')
    var $thisMoreRepliesbtn = $(e).children('.expander__more')

    if ($thisExpander.attr("data-expander") == 'hide') {
        $thisExpander.attr("data-expander", "show")

        $thisExpanderReplies.addClass('expander__content--show')
        $thisLessRepliesbtn.toggleClass('d-none')
        $thisMoreRepliesbtn.toggleClass('d-none')
        return
    }
    if ($thisExpander.attr("data-expander") == 'show') {
        $thisExpander.attr("data-expander", "hide")

        $thisExpanderReplies.removeClass('expander__content--show')
        $thisLessRepliesbtn.toggleClass('d-none')
        $thisMoreRepliesbtn.toggleClass('d-none')
        return
    }
}

/*************** Function ***************/



/*************** Form ***************/
var $user_id = $("input[type=hidden][name=user_id]").val()
var $username = $("input[type=hidden][name=username]").val()
var $isComicComment = $("input[type=hidden][name=isComicComment]").val()
var $title = $("input[type=hidden][name=title]").val()
var $comicSlug = $("input[type=hidden][name=comicSlug]").val()
var formData

//  Start POST comment
window.postComment = function (form) {
    formData = {
        text: form.text.value,
        title: $title,
        userId: $user_id,
        userName: $username,
        comicSlug: $comicSlug,
        isComicComment: $isComicComment,
        updatedAt: new Date().toISOString()
    }
    $.ajax({
        type: "POST",
        url: `/comic/comment`,
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            socket.emit('new_comment', response)
        }
    })
    return false;
}; 

//  Start destroy comment 
window.destroyComment = function (form) {
    formData = {
        comment_id: form.comment_id.value,
        comicSlug: $comicSlug,
    }
    if (confirm("Bạn chắc chắn muốn xóa comment này ?")) {
        $.ajax({
            type: "POST",
            url: `/comic/comment/destroyComment?_method=DELETE`,
            data: JSON.stringify(formData),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                socket.emit('delete_comment', formData)
            }
        })
    }
    return false;
}; 

//  Start POST reply
window.postReply = function (form) {
    formData = {
        comment_id: form.comment_id.value,
        text: form.text.value,
        title: $title,
        userId: $user_id,
        userName: $username,
        comicSlug: $comicSlug,
        updatedAt:  new Date().toISOString()
    }
    $.ajax({
        type: "POST",
        url: `/comic/reply`,
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            hideReplydialog(form)
            socket.emit('new_reply', response) 
        }
    })
    return false;
}; 

//  Start destroy reply 
window.destroyReply = function (form) {
    formData = {
        reply_id: form.reply_id.value,
        comment_id: form.comment_id.value,
        comicSlug: $comicSlug,
    }
    if (confirm("Bạn chắc chắn muốn xóa Reply này ?")) {
        $.ajax({
            type: "POST",
            url: `/comic/comment/destroyReply?_method=DELETE`,
            data: JSON.stringify(formData),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                socket.emit('delete_reply', formData)
            }
        })
    }
    return false;
}; 
/***************  Form ***************/



/*************** Socket IO ***************/
var socket = io()

socket.on('new_comment', response => {
    $('#commentcontainer').prepend(response)
    $('#commentcontainer > :nth-child(1)').css('display','block').hide().show("slow")
});

socket.on('new_reply', response => {
    
    $(`#comment-${formData.comment_id}`).append(response)
    $(`#comment-${formData.comment_id} > :last-child`).css('display','block').hide().show("slow")
});

socket.on('delete_comment', formData => {
    $(`#comment-${formData.comment_id}`).css('display','block').slideUp("slow", function() { $(this).remove();});
})

socket.on('delete_reply', formData => {
    $(`#reply-${formData.reply_id}`).css('display','block').slideUp("slow", function() { $(this).remove();});
})
/*************** Socket IO ***************/