// ==========================
// Global Timeline Customization for all DocTypes
// ==========================

frappe.ui.form.Form.prototype.custom_timeline_setup = function() {
    const frm = this;
    if (!frm.$wrapper) return;

    console.log(`[Timeline Custom] Running for ${frm.doctype}`);

    // ===== 1. Hide default activity section immediately =====
    const hideOriginalActivity = () => {
        frm.$wrapper.find('.timeline-item.activity-title').hide();
        frm.$wrapper.find('.show-all-activity').hide();
        console.log(`[Timeline Custom] Default activity section hidden`);
    };
    hideOriginalActivity();

    // ===== 2. Observe DOM mutations to hide newly added activity titles dynamically =====
    if (!frm._activityObserver) {
        frm._activityObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    const $node = $(node);
                    if ($node.hasClass && $node.hasClass('timeline-item') && $node.hasClass('activity-title')) {
                        $node.hide();
                        console.log(`[Timeline Custom] Hidden newly added activity-title`);
                    }
                    if ($node.hasClass && $node.hasClass('show-all-activity')) {
                        $node.hide();
                        console.log(`[Timeline Custom] Hidden newly added show-all-activity`);
                    }
                });
            });
        });
        frm._activityObserver.observe(frm.$wrapper[0], { childList: true, subtree: true });
    }

    // ===== 3. Read toggle state from localStorage =====
    const commentsKey = `timeline_comments_toggle_${frm.doctype}_${frappe.session.user}`;
    const activityKey = `timeline_activity_toggle_${frm.doctype}_${frappe.session.user}`;
    const showComments = JSON.parse(localStorage.getItem(commentsKey) ?? 'true');
    const showActivity = JSON.parse(localStorage.getItem(activityKey) ?? 'true');

    // ===== 4. Delay to ensure timeline items are rendered =====
    setTimeout(() => {
        const mainTimeline = frm.$wrapper.find('.new-timeline, .form-timeline');
        if (!mainTimeline.length) return;

        const timelineItems = mainTimeline.find('.timeline-item');
        if (!timelineItems.length) return;

        // ===== 5. Build custom wrappers =====
        const commentsWrapper = $('<div class="timeline-section comments-section"></div>');
        const commentsList = $('<div class="comments-list"></div>');
        const activityWrapper = $('<div class="timeline-section activity-section"></div>');
        const activityItems = $('<div class="activity-items"></div>');

        // ===== 6. Comments heading & toggle =====
        const commentsHeading = $(`
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4>Comments</h4>
                <div style="display:flex; align-items:center;">
                    <div class="comments-action-buttons" style="margin-right:10px;"></div>
                    <label class="switch" style="margin:0; cursor:pointer;">
                        <input type="checkbox" class="comments-toggle">
                        <span class="slider round"></span>
                    </label>
                    <span style="margin-left:5px;">Show All Comments</span>
                </div>
            </div>
        `);
        commentsWrapper.append(commentsHeading).append(commentsList);
        const commentsButtons = commentsHeading.find('.comments-action-buttons');
        const commentsToggle = commentsHeading.find('.comments-toggle').prop('checked', showComments);

        // ===== 7. Activity heading & toggle =====
        const activityHeading = $(`
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4>Activity</h4>
                <div style="display:flex; align-items:center;">
                    <label class="switch" style="margin:0; cursor:pointer;">
                        <input type="checkbox" class="activity-toggle">
                        <span class="slider round"></span>
                    </label>
                    <span style="margin-left:5px;">Show All Activity</span>
                </div>
            </div>
        `);
        activityWrapper.append(activityHeading).append(activityItems);
        const activityToggle = activityHeading.find('.activity-toggle').prop('checked', showActivity);

        // ===== 8. Add toggle CSS =====
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
                </style>
            `);
        }

        // ===== 9. Separate timeline items into comments vs activity =====
        timelineItems.each(function () {
            const item = $(this);
            const doctype = item.attr('data-doctype');

            // Move action buttons to comments header
            const actionButtons = item.find('.action-buttons');
            if (actionButtons.length) commentsButtons.append(actionButtons);

            if (doctype === 'Comment') {
                commentsList.append(item);
                if (!showComments) item.hide();
            } else {
                activityItems.append(item);
                if (!showActivity) item.hide();
            }
        });

        // ===== 10. Handle toggle changes =====
        commentsToggle.on('change', function () {
            commentsList.toggle(this.checked);
            localStorage.setItem(commentsKey, this.checked);
            console.log(`[Timeline Custom] Comments toggled: ${this.checked}`);
        });
        activityToggle.on('change', function () {
            activityItems.toggle(this.checked);
            localStorage.setItem(activityKey, this.checked);
            console.log(`[Timeline Custom] Activity toggled: ${this.checked}`);
        });

        // ===== 11. Clear main timeline and append custom sections =====
        mainTimeline.empty().append(commentsWrapper).append(activityWrapper);
        console.log(`[Timeline Custom] Custom timeline built`);
    }, 150); // small delay
};

// ===== 12. Patch refresh to include our setup globally =====
const _old_refresh = frappe.ui.form.Form.prototype.refresh;
frappe.ui.form.Form.prototype.refresh = function() {
    _old_refresh.apply(this, arguments);
    this.custom_timeline_setup();
};

