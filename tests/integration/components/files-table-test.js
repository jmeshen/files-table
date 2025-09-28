import { module, test } from 'qunit';
import { setupRenderingTest } from 'homework/tests/helpers';
import { render, click, find, findAll, waitFor } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | files-table', function (hooks) {
  setupRenderingTest(hooks);

  const TEMPLATE = hbs`<FilesTable @files={{this.files}} />`;

  hooks.beforeEach(function () {
    // Mock files data for testing
    this.files = [
      {
        name: 'test1.exe',
        device: 'ServerA',
        path: '\\Device\\HarddiskVolume1\\test1.exe',
        status: 'available',
      },
      {
        name: 'test2.dll',
        device: 'ServerB',
        path: '\\Device\\HarddiskVolume2\\test2.dll',
        status: 'scheduled',
      },
      {
        name: 'test3.txt',
        device: 'ServerC',
        path: '\\Device\\HarddiskVolume1\\test3.txt',
        status: 'available',
      },
    ];

    this.originalAlert = window.alert;
    this.alertMessages = [];
    // Stub alert to prevent real alerts during tests
    window.alert = (message) => {
      this.alertMessages.push(message);
    };
  });

  hooks.afterEach(function () {
    // Restore original alert
    window.alert = this.originalAlert;
  });

  test('it renders with empty files array', async function (assert) {
    this.set('files', []);
    await render(TEMPLATE);

    assert.dom('.files-table__container').exists('Table container renders');
    assert
      .dom('.files-table__actions')
      .doesNotExist('Table actions container should not render');
    assert
      .dom('[data-test-select-all-checkbox]')
      .doesNotExist('Select all checkbox should not exist');
    assert
      .dom('.files-table__actions__download-btn')
      .doesNotExist('Download button should not exist');
    // Empty state message should be rendered
    assert.dom('.files-table__empty-state').hasText('No files available');
  });

  test('it renders with files data', async function (assert) {
    await render(TEMPLATE);
    assert.dom('.files-table__container').exists('Table container renders');
    assert
      .dom('.files-table__actions')
      .exists('Table actions container should render');
    assert.dom('.files-table').exists('EmberTable renders');
    assert
      .dom('.files-table__actions span')
      .hasText('None Selected', 'Shows correct initial selection text');
    assert
      .dom('[data-test-select-all-checkbox]')
      .exists('Select all checkbox exists');
    assert
      .dom('.files-table__actions__download-btn')
      .doesNotExist('Download button should not exist initially');
    assert.dom('.files-table__empty-state').doesNotExist('No empty state');
  });

  test('select all checkbox functionality', async function (assert) {
    await render(TEMPLATE);

    const selectAllCheckbox = find('[data-test-select-all-checkbox]');

    assert.false(selectAllCheckbox.checked, 'Initially not checked');
    assert.false(
      selectAllCheckbox.indeterminate,
      'Initially not indeterminate'
    );
    assert.dom('.files-table__actions span').hasText('None Selected');

    await click(selectAllCheckbox);

    assert
      .dom('.files-table__actions span')
      .hasText('Selected 3', 'Shows correct count after select all');

    // Click select all again to deselect
    await click(selectAllCheckbox);

    assert
      .dom('.files-table__actions span')
      .hasText('None Selected', 'Deselects all items');
  });

  test('download button appears when available files are selected', async function (assert) {
    await render(TEMPLATE);

    // Initially no download button
    assert
      .dom('.files-table__actions button')
      .doesNotExist('Download button hidden initially');

    // Select all files (which includes available ones)
    await click('[data-test-select-all-checkbox]');

    assert
      .dom('.files-table__actions button')
      .exists('Download button appears when available files selected');
    assert
      .dom('.files-table__actions button')
      .hasText('⬇ Download Selected', 'Download button has correct text');
  });

  test('download button functionality', async function (assert) {
    await render(TEMPLATE);

    // Select all files
    await click('[data-test-select-all-checkbox]');

    // Click download button
    await click('.files-table__actions button');

    assert.strictEqual(this.alertMessages.length, 1, 'Alert was called once');
    assert.true(
      this.alertMessages[0].includes(
        '\\Device\\HarddiskVolume1\\test1.exe from ServerA'
      ),
      'Alert contains first available file'
    );
    assert.true(
      this.alertMessages[0].includes(
        '\\Device\\HarddiskVolume1\\test3.txt from ServerC'
      ),
      'Alert contains second available file'
    );
    assert.false(
      this.alertMessages[0].includes('test2.dll'),
      'Alert does not contain scheduled file'
    );
  });

  test('names, devices, paths, and status labels are correctly displayed in table rows', async function (assert) {
    await render(TEMPLATE);

    // Wait for ember-table to finish rendering rows
    await waitFor('.files-table__row');
    assert.dom('.files-table').exists('Table renders with status data');
    const rows = findAll('.files-table__row');
    assert.dom('.files-table__row').exists({ count: 3 }, 'Three rows rendered');
    const firstRowName = rows[0].children[1].innerText;
    const secondRowName = rows[1].children[1].innerText;
    const thirdRowName = rows[2].children[1].innerText;

    assert.strictEqual(firstRowName, 'test1.exe', 'First row Name correct');
    assert.strictEqual(secondRowName, 'test2.dll', 'Second row Name correct');
    assert.strictEqual(thirdRowName, 'test3.txt', 'Third row Name correct');

    const firstRowDevice = rows[0].children[2].innerText;
    const secondRowDevice = rows[1].children[2].innerText;
    const thirdRowDevice = rows[2].children[2].innerText;

    assert.strictEqual(firstRowDevice, 'ServerA', 'First row Device correct');
    assert.strictEqual(secondRowDevice, 'ServerB', 'Second row Device correct');
    assert.strictEqual(thirdRowDevice, 'ServerC', 'Third row Device correct');

    const firstRowPath = rows[0].children[3].innerText;
    const secondRowPath = rows[1].children[3].innerText;
    const thirdRowPath = rows[2].children[3].innerText;

    assert.strictEqual(
      firstRowPath,
      '\\Device\\HarddiskVolume1\\test1.exe',
      'First row Path correct'
    );
    assert.strictEqual(
      secondRowPath,
      '\\Device\\HarddiskVolume2\\test2.dll',
      'Second row Path correct'
    );
    assert.strictEqual(
      thirdRowPath,
      '\\Device\\HarddiskVolume1\\test3.txt',
      'Third row Path correct'
    );

    const firstRowStatus = rows[0].children[4].innerText;
    const secondRowStatus = rows[1].children[4].innerText;
    const thirdRowStatus = rows[2].children[4].innerText;

    assert.strictEqual(
      firstRowStatus,
      'Available',
      'First row Status label correct'
    );
    assert.strictEqual(
      secondRowStatus,
      'Scheduled',
      'Second row Status label correct'
    );
    assert.strictEqual(
      thirdRowStatus,
      'Available',
      'Third row Status label correct'
    );
  });
});
