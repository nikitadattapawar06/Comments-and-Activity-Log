frappe.ui.form.Form.prototype.custom_timeline_setup = function () {
    const frm = this;
    if (!frm.$wrapper) return;

    console.log(`[Timeline Custom] Running for ${frm.doctype}`);

    // ===== 1. Hide Frappe’s default activity section =====
    const hideOriginalActivity = () => {
        frm.$wrapper.find('.timeline-item.activity-title').hide();
        frm.$wrapper.find('.show-all-activity').hide();
        frm.$wrapper.find('.timeline-head, .timeline-head:contains("Activity")').hide();
    };
    hideOriginalActivity();

    // ===== 2. Observe DOM mutations =====
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

    // ===== 3. Load toggle states =====
    const commentsKey = `timeline_comments_toggle_${frm.doctype}_${frappe.session.user}`;
    const activityKey = `timeline_activity_toggle_${frm.doctype}_${frappe.session.user}`;
    const showComments = JSON.parse(localStorage.getItem(commentsKey) ?? 'true');
    const showActivity = JSON.parse(localStorage.getItem(activityKey) ?? 'true');

    // ===== 4. Build custom timeline =====
    setTimeout(() => {
        const mainTimeline = frm.$wrapper.find('.new-timeline, .form-timeline');
        if (!mainTimeline.length) return;

        const timelineItems = mainTimeline.find('.timeline-item');
        if (!timelineItems.length) return;

        const commentInputWrapper = frm.$wrapper.find('.comment-input-wrapper');
        const commentInputExists = commentInputWrapper.length > 0 && commentInputWrapper.is(':visible');

        const commentsWrapper = $('<div class="timeline-section comments-section"></div>');
        const commentsList = $('<div class="comments-list"></div>');
        const activityWrapper = $('<div class="timeline-section activity-section"></div>');
        const activityItems = $('<div class="activity-items"></div>');

        let commentsToggle, commentsButtons;

        // ===== 5. Comments Header =====
        if (commentInputExists) {
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
            commentsWrapper.append(commentsHeading).append(commentsList);
            commentsButtons = commentsHeading.find('.comments-action-buttons');
            commentsToggle = commentsHeading.find('.comments-toggle');
        }

        // ===== 6. Activity Header =====
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
        activityWrapper.append(activityHeading).append(activityItems);

        const activityToggleContainer = activityHeading.find('.activity-toggle-container');
        const activityToggle = activityHeading.find('.activity-toggle');

        // ===== 7. Global CSS Injection =====
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

                    /* Timeline layout adjustments */
                    .form-timeline::before, .new-timeline::before { display: none !important; }
                    .timeline-section { padding-left: 0 !important; margin-bottom: 20px; border-left: none !important; }
                    .activity-section { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }

                    /* Activity section styles */
                    .activity-header, .activity-controls { flex-wrap: nowrap !important; }
                    .activity-action-buttons { display:flex; align-items:center; gap:12px; }
                    .activity-action-buttons .btn:not(:last-child) { margin-right:8px !important; }

                    /* Comments section styles (mirrors Activity layout) */
                    .comments-controls { display:flex; align-items:center; gap:10px; flex-wrap:nowrap; }
                    .comments-action-buttons { display:flex; align-items:center; gap:12px !important; }
                    .comments-action-buttons .btn:not(:last-child) { margin-right:8px !important; }
                    .comments-toggle-container { display:flex; align-items:center; }

                    /* General */
                    .timeline-item.activity-title, .show-all-activity, .timeline-head { display: none !important; }
                    .pin-btn { cursor: pointer; font-size: 12px; margin-left: 10px; color: var(--text-muted); }
                    .pin-btn:hover { text-decoration: underline; color: var(--text-color); }
                </style>
            `);
        }

        // ===== 8. Separate Comments vs Activity =====
        timelineItems.each(function () {
            const item = $(this);
            const doctype = item.attr('data-doctype');
            const actionButtons = item.find('.action-buttons');
            if (actionButtons.length && commentInputExists) commentsButtons.append(actionButtons);
            if (doctype === 'Comment' && commentInputExists) {
                commentsList.append(item);
                if (!showComments) item.hide();
            } else {
                activityItems.append(item);
                if (!showActivity) item.hide();
            }
        });

        // ===== 9. Move buttons inline =====
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

        // ===== 10. Toggle Handlers =====
        if (commentInputExists) {
            commentsToggle.on('change', function () {
                const checked = this.checked;
                commentsList.find('.timeline-item').toggle(checked);
                localStorage.setItem(commentsKey, checked);
            });
        }

        activityToggle.on('change', function () {
            const checked = this.checked;
            activityItems.find('.timeline-item').toggle(checked);
            localStorage.setItem(activityKey, checked);
        });

        // ===== 11. Pin/Unpin Buttons =====
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
                    fields: ['name', 'custom_is_pinned']
                },
                callback: function(r) {
                    const comments = r.message || [];

                    const pinnedComments = [];
                    const unpinnedComments = [];

                    $commentItems.each(function() {
                        const $item = $(this);
                        const commentName = $item.attr('data-name');
                        const comment = comments.find(c => c.name === commentName);
                        if (!comment) return;

                        $item.find('.pin-btn').remove();

                        const pinned = comment.custom_is_pinned === 1;
                        const btnText = pinned ? "Unpin 📌" : "Pin 📌";

                        const $btn = $(`<a class="pin-btn">${btnText}</a>`);

                        $item.find('.timeline-content').append($btn);

                        if (pinned) pinnedComments.push($item);
                        else unpinnedComments.push($item);
                    });

                    // Reorder pinned comments first
                    pinnedComments.forEach($el => commentsList.prepend($el));
                    unpinnedComments.forEach($el => commentsList.append($el));

                    // Pin/unpin click handler
                    commentsList.off('click', '.pin-btn');
                    commentsList.on('click', '.pin-btn', function() {
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
                                $btn.text(currentlyPinned ? "Pin 📌" : "Unpin 📌");

                                // Move comment dynamically
                                if (!currentlyPinned) commentsList.prepend($item);
                                else commentsList.append($item);

                                frappe.show_alert(currentlyPinned ? "Comment Unpinned" : "Comment Pinned");
                            }
                        });
                    });
                }
            });
        };

        addPinButtons();

        // ===== 12. Replace timeline content =====
        mainTimeline.empty();
        if (commentInputExists) mainTimeline.append(commentsWrapper);
        mainTimeline.append(activityWrapper);
        hideOriginalActivity();

        console.log(`[Timeline Custom] Timeline rebuilt with consistent button spacing`);
    }, 500);
};

// ===== 13. Apply globally on form refresh =====
const _old_refresh = frappe.ui.form.Form.prototype.refresh;
frappe.ui.form.Form.prototype.refresh = function () {
    _old_refresh.apply(this, arguments);
    this.custom_timeline_setup();
};
