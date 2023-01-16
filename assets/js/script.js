const mainHost = 'https://graphql-sqlite3-server.khoa2016.repl.co/graphql';

(async () => {

  let login_page = '/pages/login';
  const user_name = 'admin';
  const password = 'admin';
  const core_libs = [
    // AdminLTE App
    'https://admin-lte-cdn.surge.sh/dist/js/adminlte.min.js',
    // custom
    '/assets/js/helper.js',
  ];

  const loadJs = function (file) {
    return new Promise((resolve) => {
      fetch(file)
        .then(res => {
          if (res.status !== 200)
            throw new Error(`File [${file}] does not exists.`);
          return res.text();
        }).then(js => {
          eval(js);
          resolve();
        }).catch(ex => {
          console.log(`Error load js: ${file}`, ex);
          resolve();
        });
    });
  };

  const LoadFile = function (file) {
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
  };

  function InitOther() {
    (new adminlte.Treeview($('[data-widget="treeview"]'), { trigger: '.nav-link' })).init();
    ActiveMenu();

    $('#btn-logout').click(function (e) {
      e.preventDefault();
      EraseCookie(user_name);
      location.href = `${login_page}.html`;
    });

    $('#btn-reload').click(function (e) {
      e.preventDefault();
      if (typeof table_js !== 'undefined')
        table_js.ajax.reload();
    });
  };

  function ProcessLayout(arr) {
    const indxLayout = arr.findIndex((elem) => { return elem.name.toLowerCase() === 'layout' });

    if (indxLayout === -1)
      return;

    const layout = arr.splice(indxLayout, 1)[0];

    $('body').find('layout').replaceWith(layout.content);
    $.each(arr, function (indx, elm) {
      $('body').find(elm.name).replaceWith(elm.content);
    });

    InitOther();

    if (typeof InitPage === 'function')
      InitPage(arr);
  };

  function ActiveMenu() {
    let page = location.pathname;
    if (page.length < 2)
      page = '/index';
    $('#navigation a[href="' + page + '"], #navigation a[href="' + page + '.html"]').addClass('active');
  };

  async function LoadContent(files) {
    try {
      const arr = await Promise.all(files.map(async file => await LoadFile(file)));
      ProcessLayout(arr);
    } catch (err) {
      console.log('Error load files', err);
    };
  };

  async function Main() {

    $('#btn-admin-signin').click(function (e) {
      e.preventDefault();

      if ($('form input[name="user_name"]').val() === user_name &&
        $('form input[name="password"]').val() === password) {
        SetCookie(user_name, EncodeAuth(user_name, password), 1);

        const query = location.href.split('?')[1];
        const obj = QueryStringToObject(query);

        // console.log('Success', res, obj);
        location.href = obj.return_url || '/';
        return;
      }

      alert('Invalid password.');
    });

    if (location.pathname.toLowerCase() !== login_page &&
      location.pathname.toLowerCase() !== login_page + '.html') {
      if (!GetCookie('admin')) {
        if (login_page.toLowerCase().indexOf('.html') === -1)
          login_page += '.html';
        location.href = login_page + '?return_url=' + location.pathname;
        return;
      }
    }

    var files = [{ path: '/parts/layout.html', name: 'layout' }, { path: '/parts/sidebar.html', name: 'sidebar' },
    { path: '/parts/header.html', name: 'header' }, { path: '/parts/modals.html', name: 'modals' }];

    const layout = document.querySelector('layout');
    if (!layout)
      return;

    let content_to_load = layout.getAttribute('data-page');
    if (!content_to_load) {
      if (location.pathname.length > 1) {
        const seg = location.pathname.split('/');
        content_to_load = seg[seg.length - 1];
      } else
        content_to_load = 'index';
      content_to_load = content_to_load.toLowerCase().replace('.html', '');
    }

    files.push({ path: `/content/${content_to_load}.html`, name: 'content' });
    if (typeof window.addition_file !== 'undefined') {
      if (Array.isArray(window.addition_file))
        files = files.concat(window.addition_file);
      else
        files.push(window.addition_file);

      delete window.addition_file;
    }


    await LoadContent(files);
  };

  await Promise.all(core_libs.map(async item => {
    await loadJs(item);
  }));

  if (Array.isArray(window.addition_libs) && window.addition_libs.length > 0) {
    await Promise.all(window.addition_libs.map(async item => {
      await loadJs(item);
    }));
  }

  await Main();

})();
