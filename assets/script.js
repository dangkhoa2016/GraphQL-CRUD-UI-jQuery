var mainHost = 'https://graphql-sqlite3-server.khoa2016.repl.co/graphql';

$(function () {

    var login_page = "/pages/login";

    var LoadFile = function (file) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: file.path, type: 'get',
                contentType: 'text/plain',
                error: function () {
                    file.content = '';
                    resolve(file);
                },
                success: function (res) {
                    file.content = res;
                    resolve(file);
                }
            })
        });
    }

    function InitOther() {
        new adminlte.Treeview($('[data-widget="treeview"]'), { trigger: '.nav-link' }).init();
        ActiveMenu();

        Handlebars.registerHelper('formatTime', function (date, format) {
            var mmnt = moment(parseFloat(date));
            return mmnt.format(format);
        });

        Handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        Handlebars.registerHelper('select', function (value, options) {
            // Create a select element 
            var select = document.createElement('select');

            // Populate it with the option HTML
            select.innerHTML = options.fn(this);

            // Set the value
            select.value = value;

            // Find the selected node, if it exists, add the selected attribute to it
            if (select.children[select.selectedIndex])
                select.children[select.selectedIndex].setAttribute('selected', 'selected');

            return select.innerHTML;
        });

        $('#btn-logout').click(function (e) {
            e.preventDefault();
            EraseCookie('admin');
            location.href = login_page;
        });


        $("#btn-reload").click(function (e) {
            e.preventDefault();
            if (typeof t !== 'undefined')
                t.ajax.reload();
        });
    }

    function ProcessLayout(arr) {
        var indxLayout = arr.findIndex((elem) => { return elem.name.toLowerCase() === 'layout' });

        if (indxLayout !== -1) {
            var layout = arr.splice(indxLayout, 1)[0];

            $('body').find('layout').replaceWith(layout.content);
            $.each(arr, function (indx, elm) {
                $('body').find(elm.name).replaceWith(elm.content);
            });

            InitOther();

            if (typeof InitPage === 'function')
                InitPage(arr);
        }
    }


    function ActiveMenu() {
        var page = location.pathname;
        if (page.length < 2)
            page = '/index';
        $('#navigation a[href="' + page + '"], #navigation a[href="' + page + '.html"]').addClass('active');
    }

    function LoadContent() {

        var files = [{ path: '/parts/layout.html', name: 'layout' }, { path: '/parts/sidebar.html', name: 'sidebar' },
        { path: '/parts/header.html', name: 'header' }, { path: '/parts/modals.html', name: 'modals' }];

        var content_to_load = 'index.html';
        var cur_page = location.pathname;
        if (cur_page.length > 1) {
            var seg = cur_page.split('/');
            content_to_load = seg[seg.length - 1];
        }

        files.push({ path: '/content/' + content_to_load, name: 'content' });
        if (typeof addition_file !== 'undefined')
            files.push(addition_file);

        Promise.all(files.map((file) => { return LoadFile(file) }))
            .then((arr) => {
                ProcessLayout(arr);
            }).catch((err) => {
                console.log('Error load files', err);
            });
    }


    if (location.pathname.toLowerCase() !== login_page && location.pathname.toLowerCase() !== login_page + '.html') {
        if (!GetCookie('admin')) {
            if (login_page.toLowerCase().indexOf('.html') === -1)
              login_page += '.html';
            location.href = login_page + '?return_url=' + location.pathname;
            return;
        } else {
            LoadContent();
        }
    }

    $('#btn-admin-signin').click(function (e) {
        e.preventDefault();

        if ($('form input[name="user_name"]').val() === 'admin' && $('form input[name="password"]').val() === 'admin') {
            SetCookie('admin', EncodeAuth('admin', 'admin'), 1);
            var query = location.href.split("?")[1];
            var obj = QueryStringToObject(query);

            // console.log("Success", res, obj);
            location.href = obj.return_url || "/";
        } else {
            alert('Invalid password.');
        }
    });

});