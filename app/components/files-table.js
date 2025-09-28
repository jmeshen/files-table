import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

const STATUS_OPTIONS = {
  AVAILABLE: 'Available',
  SCHEDULED: 'Scheduled',
};

const SELECTION_STATES = {
  NONE: 'none',
  ALL: 'all',
  INDETERMINATE: 'indeterminate',
};

/**
 * FilesTable component - displays files in a table with status indicators
 *
 * @param {Object} args - Component arguments
 * @param {Array<FileItem>} [args.files = []] - Array of file objects to display
 *
 * @typedef {Object} FileItem
 * @property {string} name - File name
 * @property {string} device - Device name where file is located
 * @property {string} path - Full file path
 * @property {string} status - File status ('available', 'scheduled')
 *
 * @example
 * Basic usage
 * <FilesTable @files={{this.files}} />
 *
 * @example
 * File object structure
 * const files = [
 *   {
 *     name: 'example.exe',
 *     device: 'ServerA',
 *     path: '\Device\HarddiskVolume1\example.exe',
 *     status: 'available'
 *   }
 * ];
 */
export default class FilesTable extends Component {
  @tracked selection = [];
  @tracked decoratedFiles = null;

  sorts = [
    {
      valuePath: 'name',
      isAscending: true,
    },
  ];

  constructor() {
    super(...arguments);
    this._decorateFiles();
  }

  /**
   * Table column definitions
   * @returns {Array<Object>} - Column configuration for ember-table
   */
  get columns() {
    return [
      {
        name: '',
        valuePath: 'selection',
        width: 50,
        isSelectable: true,
        textAlign: 'left',
        isFixed: 'left',
      },
      { name: 'Name', valuePath: 'name', width: 200 },
      { name: 'Device', valuePath: 'device', width: 200 },
      { name: 'Path', valuePath: 'path', width: 500 },
      { name: 'Status', valuePath: 'statusLabel', width: 250 },
    ];
  }

  /**
   * Computed text for selected files display
   * @returns {string} - Text indicating number of selected files
   */
  get selectedText() {
    const count = this.selection.length;
    return count === 0 ? 'None Selected' : `Selected ${count}`;
  }

  /**
   * Calculate selection states for the Select All checkbox
   * @returns {string} - One of 'none', 'all', or 'indeterminate'
   */
  get selectionState() {
    const totalFiles = this.decoratedFiles.length;
    const selectedCount = this.selection.length;

    if (selectedCount === 0) {
      return SELECTION_STATES.NONE;
    } else if (selectedCount === totalFiles) {
      return SELECTION_STATES.ALL;
    } else {
      return SELECTION_STATES.INDETERMINATE;
    }
  }

  /**
   * Whether all items are selected
   * @returns {boolean}
   */
  get isAllSelected() {
    return this.selectionState === SELECTION_STATES.ALL;
  }

  /**
   * Whether some but not all items are selected (indeterminate state)
   * @returns {boolean}
   */
  get isIndeterminate() {
    return this.selectionState === SELECTION_STATES.INDETERMINATE;
  }

  /**
   * Whether to show the Download Selected button
   * @returns {boolean}
   */
  get shouldShowDownloadAction() {
    return this.selection.some(
      (file) => file.statusLabel === STATUS_OPTIONS.AVAILABLE
    );
  }

  /**
   * Handles Select All checkbox click
   */
  @action
  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selection = [];
    } else {
      this.selection = [...this.decoratedFiles];
    }
  }

  /**
   * Handles selection changes from ember-table
   * @param {Array} newSelection - Array of selected row objects
   */
  @action
  updateSelection(newSelection) {
    this.selection = newSelection;
  }

  /**
   * Handles Downloaded Selected button click
   * Opens an alert that displays the selected available files,
   * Files that are selected and not "available" are omitted
   */
  @action
  downloadAvailableFiles() {
    const availableFiles = this.selection.filter(
      (file) => file.statusLabel === STATUS_OPTIONS.AVAILABLE
    );
    const fileDescriptions = availableFiles.map(
      (file) => `${file.path} from ${file.device}`
    );
    window.alert(`Downloading files:\n\n${fileDescriptions.join('\n\n')}`);
  }

  /**
   * @private
   * Decorates raw files with additional properties for display (e.g. statusLabel)
   *
   * @typedef {Object} DecoratedFileItem
   * @property {string} name - File name
   * @property {string} device - Device name where file is located
   * @property {string} path - Full file path
   * @property {string} status - File status ('available', 'scheduled')
   * @property {string} statusLabel - File status label ('Available', 'Scheduled')
   *
   * @returns {Array<DecoratedFileItem>}
   */
  _decorateFiles() {
    const rawFiles = this.args.files || [];
    this.decoratedFiles = rawFiles.map((file) => {
      return {
        ...file,
        statusLabel: STATUS_OPTIONS[file.status.toUpperCase()],
      };
    });
  }
}
