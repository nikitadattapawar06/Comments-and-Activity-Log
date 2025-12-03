frappe.ui.form.Form.prototype.custom_timeline_setup = function () {
    const frm = this;
    if (!frm.$wrapper) return;

    if (frm.is_comment_setup_running) return;
    frm.is_comment_setup_running = true;

    console.log(`[Timeline Custom] Running for ${frm.doctype}`);

    // ===== 1. Hide Frappe’s default activity section =====
    const hideOriginalActivity = () => {
        frm.$wrapper.find('.timeline-item.activity-title').hide();
        frm.$wrapper.find('.show-all-activity').hide();
        frm.$wrapper.find('.timeline-head, .timeline-head:contains("Activity")').hide();
    };
    hideOriginalActivity();

    // ===== 2. Observe DOM mutations (Kept as is) =====
    if (!frm._activityObserver) {
        frm._activityObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    const $node = $(node);
                    if ($node.hasClass && ($node.hasClass('activity-title') || $node.hasClass('show-all-activity'))) {
                        $node.hide();
                    }
                    if ($node.is('.timeline-head') || $node.find('.timeline-head').length) {
                        frm.$wrapper.find('.timeline-head').hide();
                    }
                });
            });
        });
        frm._activityObserver.observe(frm.$wrapper[0], { childList: true, subtree: true });
    }

    // ===== 3. Load toggle states (Kept as is) =====
    const commentsKey = `timeline_comments_toggle_${frm.doctype}_${frappe.session.user}`;
    const activityKey = `timeline_activity_toggle_${frm.doctype}_${frappe.session.user}`;
    const showComments = JSON.parse(localStorage.getItem(commentsKey) ?? 'true');
    const showActivity = JSON.parse(localStorage.getItem(activityKey) ?? 'true');

    // ==========================================================
    // ===== 4. Build custom timeline (FIX APPLIED HERE) =====
    // ==========================================================
    // Changed delay from 500ms to 1000ms to ensure the native timeline items are fully rendered.
    setTimeout(() => {
        const mainTimeline = frm.$wrapper.find('.new-timeline, .form-timeline');
        if (!mainTimeline.length) {
            frm.is_comment_setup_running = false;
            return;
        }

        const commentInputWrapper = frm.$wrapper.find('.comment-input-wrapper');
        const commentInputExists = commentInputWrapper.length > 0 && commentInputWrapper.is(':visible');

        let commentsWrapper = frm.$wrapper.find('.comments-section');
        let activityWrapper = frm.$wrapper.find('.activity-section');

        if (!commentsWrapper.length) {
            commentsWrapper = $('<div class="timeline-section comments-section"></div>');
        }
        if (!activityWrapper.length) {
            activityWrapper = $('<div class="timeline-section activity-section"></div>');
        }

        const commentsList = commentsWrapper.find('.comments-list').length ? commentsWrapper.find('.comments-list') : $('<div class="comments-list"></div>');
        const activityItems = activityWrapper.find('.activity-items').length ? activityWrapper.find('.activity-items') : $('<div class="activity-items"></div>');

        let commentsToggle, commentsButtons;

        // ===== 4.5. Hook into native Comment button event =====
        const commentButton = frm.$wrapper.find('.btn-comment');

        if (commentButton.length && !commentButton.data('custom-hooked')) {
            commentButton.on('click.custom_timeline_hook', function () {
                setTimeout(() => {
                    frm.is_comment_setup_running = false;
                    frm.custom_timeline_setup();
                }, 800);
            });
            commentButton.data('custom-hooked', true);
        }

        // ===== 5. Comments Header (Kept as is) =====
        if (commentInputExists && !commentsWrapper.find('.comments-header').length) {
            const commentsHeading = $(`
                <div class="comments-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4 style="margin:0;">Comments</h4>
                    <div class="comments-controls" style="display:flex; align-items:center; gap:10px; flex-wrap:nowrap;">
                        <div class="comments-action-buttons" style="display:flex; align-items:center; gap:12px;"></div>
                        <div class="comments-toggle-container" style="display:flex; align-items:center;">
                            <label class="switch" style="margin:0; cursor:pointer;">
                                <input type="checkbox" class="comments-toggle" ${showComments ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                            <span style="margin-left:5px;">Show All Comments</span>
                        </div>
                    </div>
                </div>
            `);
            commentsWrapper.empty().append(commentsHeading).append(commentsList);
            commentsButtons = commentsHeading.find('.comments-action-buttons');
            commentsToggle = commentsHeading.find('.comments-toggle');
        } else if (commentInputExists) {
            commentsButtons = commentsWrapper.find('.comments-action-buttons');
            commentsToggle = commentsWrapper.find('.comments-toggle');
        }


        // ===== 6. Activity Header =====
        let activityToggleContainer, activityToggle;
        if (!activityWrapper.find('.activity-header').length) {
            const activityHeading = $(`
                <div class="activity-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:nowrap; gap:10px;">
                    <h4 style="margin:0;">Activity</h4>
                    <div class="activity-controls" style="display:flex; align-items:center; gap:10px; flex-wrap:nowrap;">
                        <div class="activity-action-buttons" style="display:flex; align-items:center; gap:12px; flex-wrap:nowrap;"></div>
                        <div class="activity-toggle-container" style="display:flex; align-items:center;">
                            <label class="switch" style="margin:0; cursor:pointer;">
                                <input type="checkbox" class="activity-toggle" ${showActivity ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                            <span style="margin-left:5px;">Show All Activity</span>
                        </div>
                    </div>
                </div>
            `);
            activityWrapper.empty().append(activityHeading).append(activityItems);
            activityToggleContainer = activityHeading.find('.activity-toggle-container');
            activityToggle = activityHeading.find('.activity-toggle');
        } else {
            activityToggleContainer = activityWrapper.find('.activity-toggle-container');
            activityToggle = activityWrapper.find('.activity-toggle');
        }

        // ===== 7. Global CSS Injection (Kept as is) =====
        if (!$('#global-timeline-toggle-style').length) {
            $('head').append(`
                <style id="global-timeline-toggle-style">
                    .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
                    .switch input { opacity: 0; width: 0; height: 0; }
                    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                        background-color: #ccc; transition: .4s; border-radius: 20px; }
                    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px;
                        background-color: white; transition: .4s; border-radius: 50%; }
                    input:checked + .slider { background-color: #0b62ff; }
                    input:checked + .slider:before { transform: translateX(20px); }

                    .form-timeline::before, .new-timeline::before { display: none !important; }
                    .timeline-section { padding-left: 0 !important; margin-bottom: 20px; border-left: none !important; }
                    .activity-section { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }

                    .activity-header, .activity-controls { flex-wrap: nowrap !important; }
                    .activity-action-buttons { display:flex; align-items:center; gap:12px; }
                    .activity-action-buttons .btn:not(:last-child) { margin-right:8px !important; }

                    .comments-controls { display:flex; align-items:center; gap:10px; flex-wrap:nowrap; }
                    .comments-action-buttons { display:flex; align-items:center; gap:12px !important; }
                    .comments-action-buttons .btn:not(:last-child) { margin-right:8px !important; }
                    .comments-toggle-container { display:flex; align-items:center; }

                    .timeline-item.activity-title, .show-all-activity, .timeline-head { display: none !important; }
                    .pin-btn { cursor: pointer; font-size: 12px; margin-left: 10px; color: var(--text-muted); }
                    .pin-btn:hover { text-decoration: underline; color: var(--text-color); }

                    /* Custom class for managed LI elements to ensure proper cleanup */
                    .custom-timeline-managed-li { } 
                </style>
            `);
        }

        // ===== 8. Separate Comments vs Activity (Kept as is) =====
        mainTimeline.find('.timeline-item').each(function () {
            const item = $(this);
            const doctype = item.attr('data-doctype');

            if (item.closest(commentsList).length || item.closest(activityItems).length) {
                return true;
            }

            const actionButtons = item.find('.action-buttons');

            if (actionButtons.length && commentInputExists) {
                if (commentsButtons.find('.btn').length === 0) {
                    commentsButtons.append(actionButtons);
                }
            }

            // Mark dropdown "Delete" and inline "Edit" buttons for delegation
            item.find(".dropdown-item").each(function () {
                if ($(this).text().trim() === "Delete") {
                    $(this).attr("data-action", "delete_comment");
                }
            });
            
            // Inline Edit button (often a button.action-btn or .action-btn)
            // 🐛 FIX: Check if data-action already exists to prevent re-applying it when in edit mode
            item.find("button.action-btn, .action-btn").each(function () {
                const $btn = $(this);
                const txt = $btn.text().trim();
                // Apply the custom data-action only if it's the native Edit button 
                // AND it hasn't been set by this custom logic yet.
                if (txt === "Edit" && $btn.attr("data-action") !== "edit_comment") {
                    $btn.attr("data-action", "edit_comment");
                }
            });

            if (doctype === 'Comment' && commentInputExists) {
                commentsList.prepend(item);
                if (!showComments) item.hide();
            } else {
                activityItems.prepend(item);
                if (!showActivity) item.hide();
            }
        });

        // ===== 9. Move Toolbar Buttons =====
        const moveButtonsInline = () => {
            const buttonItem = frm.$wrapper.find('.timeline-item .timeline-content.action-buttons');
            if (buttonItem.length) {
                const buttons = buttonItem.find('.btn');
                activityToggleContainer.before(buttons);
                buttonItem.closest('.timeline-item').remove();
            }
        };
        moveButtonsInline();
        setTimeout(moveButtonsInline, 500);

        // ===== 10. Toggles (Kept as is) =====
        if (commentInputExists) {
            commentsToggle.off('change').on('change', function () {
                const checked = this.checked;
                commentsList.find('.timeline-item').toggle(checked);
                localStorage.setItem(commentsKey, checked);
            });
        }

        activityToggle.off('change').on('change', function () {
            const checked = this.checked;
            activityItems.find('.timeline-item').toggle(checked);
            localStorage.setItem(activityKey, checked);
        });

        // ===== 11. Pin/Unpin Buttons (Kept as is) =====
        const addPinButtons = () => {
            const $commentItems = commentsList.find('.timeline-item[data-doctype="Comment"]');
            if ($commentItems.length === 0) return;

            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Comment',
                    filters: {
                        reference_doctype: frm.doctype,
                        reference_name: frm.doc.name
                    },
                    fields: ['name', 'custom_is_pinned', 'creation']
                },
                callback: function (r) {
                    const comments = r.message || [];
                    const mappedComments = [];

                    $commentItems.each(function () {
                        const $item = $(this);
                        const commentName = $item.attr('data-name');
                        const commentData = comments.find(c => c.name === commentName);
                        if (!commentData) return;

                        $item.find('.pin-btn').remove();

                        const pinned = commentData.custom_is_pinned === 1;
                        const btnText = pinned ? "Unpin 📌" : "Pin 📌";

                        const $btn = $(`<a class="pin-btn">${btnText}</a>`);
                        $item.find('.timeline-content').append($btn);

                        mappedComments.push({
                            $el: $item,
                            pinned: pinned,
                            creation: new Date(commentData.creation).getTime()
                        });
                    });

                    mappedComments.sort((a, b) => b.creation - a.creation);

                    const pinnedComments = mappedComments.filter(c => c.pinned);
                    const unpinnedComments = mappedComments.filter(c => !c.pinned);

                    commentsList.empty();
                    pinnedComments.forEach(c => commentsList.append(c.$el));
                    unpinnedComments.forEach(c => commentsList.append(c.$el));

                    commentsList.off('click', '.pin-btn');
                    commentsList.on('click', '.pin-btn', function () {
                        const $btn = $(this);
                        const $item = $btn.closest('.timeline-item');
                        const commentName = $item.attr('data-name');
                        const comment = comments.find(c => c.name === commentName);
                        if (!comment) return frappe.msgprint('Comment not found!');

                        const currentlyPinned = comment.custom_is_pinned === 1;

                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'Comment',
                                name: commentName,
                                fieldname: { custom_is_pinned: currentlyPinned ? 0 : 1 }
                            },
                            callback: () => {
                                comment.custom_is_pinned = currentlyPinned ? 0 : 1;
                                frappe.show_alert(currentlyPinned ? "Comment Unpinned" : "Comment Pinned");
                                frm.is_comment_setup_running = false;
                                frm.custom_timeline_setup();
                            }
                        });
                    });
                }
            });
        };
        addPinButtons();

        // ======================================================
        // ===== DELETE COMMENT FUNCTIONALITY (UNCHANGED) =====
        // ======================================================
        const enableDeleteComment = () => {
            commentsList.off("click", "[data-action='delete_comment']");
            commentsList.on("click", "[data-action='delete_comment']", function (e) {
                e.stopPropagation();

                const $item = $(this).closest(".timeline-item");
                const commentName = $item.attr("data-name");

                if (!commentName) {
                    return frappe.msgprint("Comment ID not found!");
                }

                frappe.confirm("Delete this comment?", () => {
                    frappe.call({
                        method: "frappe.client.delete",
                        args: {
                            doctype: "Comment",
                            name: commentName
                        },
                        callback: function () {
                            frappe.show_alert("Comment deleted");
                            $item.remove();
                            setTimeout(() => {
                                location.reload();
                            }, 200);
                            
                        }
                    });
                });
            });
        };
        enableDeleteComment();

        // ======================================================
        // ===== EDIT COMMENT FUNCTIONALITY (UNCHANGED) =====
        // ======================================================
        // Delegated handler for "Edit" action
        commentsList.off("click", "[data-action='edit_comment']");
        commentsList.on("click", "[data-action='edit_comment']", function (e) {
            e.stopPropagation();

            const $origBtn = $(this);
            const $item = $origBtn.closest(".timeline-item");
            const commentName = $item.attr("data-name");

            if (!commentName) {
                return frappe.msgprint("Comment ID not found!");
            }

            // locate read and edit boxes
            const $readMode = $item.find(".content .ql-editor.read-mode, .content p"); // Added .content p fallback
            const $editBox = $item.find(".comment-edit-box");
            const $editor = $editBox.find(".ql-editor");

            // show edit box if hidden
            $editBox.show();
            
            // ensure editor has current content
            // (if editor is empty, populate from read mode)
            if ($editor.length && $.trim($editor.html()) === "") {
                // Use .html() to get content from read mode
                $editor.html($readMode.html());
            }

            // hide original read mode while editing (optional)
            $readMode.css("display", "none");

            // hide the original Edit button to avoid duplicates
            $origBtn.hide();

            // create Save / Cancel controls (only one set)
            let $actions = $item.find(".comment-edit-actions");
            if ($actions.length === 0) {
                $actions = $('<span class="comment-edit-actions"></span>');
                $origBtn.after($actions);
            } else {
                $actions.empty();
            }

            const $saveBtn = $('<button class="btn btn-primary btn-sm">Save</button>');
            const $cancelBtn = $('<button class="btn btn-link btn-sm">Cancel</button>');
            $actions.append($saveBtn).append($cancelBtn);

            // Save handler
            $saveBtn.off("click").on("click", function (ev) {
                ev.stopPropagation();
                const newHtml = $editor.html();

                // persist edited comment (fieldname: content, not comment)
                frappe.call({
                    method: "frappe.client.set_value",
                    args: {
                        doctype: "Comment",
                        name: commentName,
                        fieldname: { content: newHtml }
                    },
                    callback: function (res) {
                        // update UI
                        $readMode.html(newHtml);
                        $editBox.hide();
                        $actions.remove();
                        $origBtn.show();
                        $readMode.css("display", "");
                        frappe.show_alert("Comment updated");
                    },
                    error: function () {
                        frappe.msgprint("Failed to update comment");
                    }
                });
            });

            // Cancel handler
            $cancelBtn.off("click").on("click", function (ev) {
                ev.stopPropagation();
                // revert UI
                $editBox.hide();
                $actions.remove();
                $origBtn.show();
                $readMode.css("display", "");
            });
        });

        // ===== 12. Add single Copy Link & Delete in dropdown + hide Publish (FINAL FIX) =====
        const addCopyLinkAndHidePublishDropdown = () => {
            const $commentItems = commentsList.find('.timeline-item[data-doctype="Comment"]');

            $commentItems.each(function () {
                const $item = $(this);
                const $menu = $item.find('.more-actions .dropdown-menu');

                if (!$menu.length) return;

                const commentID = $item.attr('data-name');
                if (!commentID) return;

                // 1. Remove ALL previous custom list items by class
                $menu.find('li.custom-timeline-managed-li').remove();

                // 2. Remove any native dropdown items based on text (Native Copy Link, Publish, and Delete)
                $menu.find('.dropdown-item').filter(function () {
                    const text = $(this).text().trim();
                    return text === "Copy Link" || text === "Publish" || text === "Delete";
                }).closest('li').remove();

                // --- Insert Managed Items ---

                // 3. Insert Copy Link entry (first item)
                const $copy_li = $('<li class="custom-timeline-managed-li"></li>');
                const $copy_a = $(`<a class="dropdown-item" href="#" data-action="copy_link_dropdown">Copy Link</a>`);
                $copy_li.append($copy_a);
                $menu.prepend($copy_li); // Places Copy Link at the very top

                // 4. Insert Delete entry (last item)
                const $delete_li = $('<li class="custom-timeline-managed-li"></li>');
                const $delete_a = $(`<a class="dropdown-item" href="#" data-action="delete_comment">Delete</a>`);
                $delete_li.append($delete_a);
                $menu.append($delete_li); // Places Delete at the very bottom
            });
        };

        // Attach click handler for the dropdown copy link (delegated, UNCHANGED)
        commentsList.off('click', '[data-action="copy_link_dropdown"]');
        commentsList.on('click', '[data-action="copy_link_dropdown"]', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $link = $(this);
            const $item = $link.closest('.timeline-item');
            const commentID = $item.attr('data-name');
            if (!commentID) return frappe.msgprint('Comment ID missing!');

            const url = `${window.location.origin}${window.location.pathname}#comment-${commentID}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    frappe.show_alert('Comment link copied!');
                }).catch(() => {
                    frappe.msgprint('Failed to copy link!');
                });
            } else {
                // fallback
                const $temp = $('<input>');
                $('body').append($temp);
                $temp.val(url).select();
                try {
                    document.execCommand('copy');
                    frappe.show_alert('Comment link copied!');
                } catch (err) {
                    frappe.msgprint('Failed to copy link!');
                } finally {
                    $temp.remove();
                }
            }
        });

        // Run once now, and run again after short delays to catch elements that are added asynchronously
        addCopyLinkAndHidePublishDropdown();
        setTimeout(addCopyLinkAndHidePublishDropdown, 300);
        setTimeout(addCopyLinkAndHidePublishDropdown, 900);

        // ======================================================
        // ===== 13. Replace timeline content (UNCHANGED) =====
        // ======================================================
        if (!mainTimeline.data('custom-timeline-applied')) {
            mainTimeline.prepend(activityWrapper);
            if (commentInputExists) mainTimeline.prepend(commentsWrapper);
            mainTimeline.data('custom-timeline-applied', true);
        }

        hideOriginalActivity();

        frm.is_comment_setup_running = false;
    }, 1000); // <= CRITICAL FIX: Increased from 500 to 1000
};

// ==========================================================
// ===== GLOBAL APPLICATION LOGIC (UNCHANGED) =====
// ==========================================================

const _old_refresh = frappe.ui.form.Form.prototype.refresh;
frappe.ui.form.Form.prototype.refresh = function () {
    const frm = this;

    if (frm.is_comment_setup_running) frm.is_comment_setup_running = false;
    if (frm.$wrapper) frm.$wrapper.find('.new-timeline, .form-timeline').data('custom-timeline-applied', false);

    _old_refresh.apply(this, arguments);

    this.custom_timeline_setup();
};