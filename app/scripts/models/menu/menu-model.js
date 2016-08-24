'use strict';

var Backbone = require('backbone'),
    MenuSectionCollection = require('../../collections/menu/menu-section-collection'),
    MenuSectionModel = require('./menu-section-model'),
    GroupsMenuModel = require('./groups-menu-model'),
    Locale = require('../../util/locale'),
    Format = require('../../util/format'),
    Keys = require('../../const/keys'),
    Colors = require('../../const/colors');

var MenuModel = Backbone.Model.extend({
    defaults: {
        sections: null
    },

    menus: null,

    initialize: function() {
        this.menus = {};
        this.allItemsSection = new MenuSectionModel([{ locTitle: 'menuAllItems', icon: 'th-large', active: true,
            shortcut: Keys.DOM_VK_A, filterKey: '*' }]);
        this.allItemsItem = this.allItemsSection.get('items').models[0];
        this.groupsSection = new GroupsMenuModel();
        this.colorsSection = new MenuSectionModel([{ locTitle: 'menuColors', icon: 'bookmark', shortcut: Keys.DOM_VK_C,
            cls: 'menu__item-colors', filterKey: 'color', filterValue: true }]);
        this.colorsItem = this.colorsSection.get('items').models[0];
        var defTags = [{ locTitle: 'tags', icon: 'tags', defaultItem: true,
            disabled: { header: Locale.menuAlertNoTags, body: Locale.menuAlertNoTagsBody, icon: 'tags' } }];
        this.tagsSection = new MenuSectionModel(defTags);
        this.tagsSection.set({ scrollable: true, drag: true });
        this.tagsSection.defaultItems = defTags;
        this.trashSection = new MenuSectionModel([{ locTitle: 'menuTrash', icon: 'trash', shortcut: Keys.DOM_VK_D,
            filterKey: 'trash', filterValue: true, drop: true }]);
        Colors.AllColors.forEach(color => {
            this.colorsSection.get('items').models[0]
                .addOption({ cls: 'fa ' + color + '-color', value: color, filterValue: color });
        });
        this.menus.app = new MenuSectionCollection([
            this.allItemsSection,
            this.colorsSection,
            this.tagsSection,
            this.groupsSection,
            this.trashSection
        ]);

        this.generalSection = new MenuSectionModel([{ locTitle: 'menuSetGeneral', icon: 'cog', page: 'general', active: true }]);
        this.shortcutsSection = new MenuSectionModel([{ locTitle: 'shortcuts', icon: 'keyboard-o', page: 'shortcuts' }]);
        this.aboutSection = new MenuSectionModel([{ locTitle: 'menuSetAbout', icon: 'info', page: 'about' }]);
        this.helpSection = new MenuSectionModel([{ locTitle: 'help', icon: 'question', page: 'help' }]);
        this.filesSection = new MenuSectionModel();
        this.filesSection.set({ scrollable: true, grow: true });
        this.menus.settings = new MenuSectionCollection([
            this.generalSection,
            this.shortcutsSection,
            this.aboutSection,
            this.helpSection,
            this.filesSection
        ]);
        this.set('sections', this.menus.app);

        this.listenTo(Backbone, 'set-locale', this._setLocale);
        this._setLocale();
    },

    select: function(sel) {
        var sections = this.get('sections');
        sections.forEach(function(section) { this._select(section, sel.item); }, this);
        if (sections === this.menus.app) {
            this.colorsItem.get('options').forEach(opt => opt.set('active', opt === sel.option));
            var selColor = sel.item === this.colorsItem && sel.option ? sel.option.get('value') + '-color' : '';
            this.colorsItem.set('cls', 'menu__item-colors ' + selColor);
            var filterKey = sel.item.get('filterKey'),
                filterValue = (sel.option || sel.item).get('filterValue');
            var filter = {};
            filter[filterKey] = filterValue;
            Backbone.trigger('set-filter', filter);
        } else if (sections === this.menus.settings) {
            Backbone.trigger('set-page', { page: sel.item.get('page'), file: sel.item.get('file') });
        }
    },

    _select: function(item, selectedItem) {
        var items = item.get('items');
        if (items) {
            items.forEach(function(it) {
                it.set('active', it === selectedItem);
                this._select(it, selectedItem);
            }, this);
        }
    },

    _setLocale: function() {
        [this.menus.app, this.menus.settings].forEach(menu => {
            menu.each(section => section.get('items').each(item => {
                if (item.get('locTitle')) {
                    item.set('title', Format.capFirst(Locale[item.get('locTitle')]));
                }
            }));
        });
    },

    setMenu: function(type) {
        this.set('sections', this.menus[type]);
    }
});

module.exports = MenuModel;
