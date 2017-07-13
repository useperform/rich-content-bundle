import React from 'react';
import css from './editor.scss';
import BlockList from './BlockList';
import Toolbar from './Toolbar';
import 'whatwg-fetch';
import PropTypes from 'prop-types';

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      contentId: this.props.initialContentId,
    };
  }
  getChildContext() {
    return {store: this.props.store};
  }

  componentDidMount() {
    if (true === this.state.loaded || !this.state.contentId) {
      return;
    }

    const url = '/admin/_editor/content/get/' + this.state.contentId;
    fetch(url, {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(json => {
      this.setState({
        loaded: true
      });
      this.props.store.dispatch({
        type: 'CONTENT_LOAD',
        json
      });
    });
  }

  saveNew(onSuccess, onError) {
    const url = '/admin/_editor/content/save-new';

    return fetch(url, {
      body: JSON.stringify(this.getPostBody()),
      credentials: 'include',
      method: 'POST'
    }).then(this.handleFetch)
      .then(json => {
        this.setState({
          contentId: json.id,
        });
        onSuccess(json);
      }).catch(error => {
        app.func.showError(error);
        onError(error);
      });
  }

  save(onSuccess, onError) {
    if (!this.state.contentId) {
      return this.saveNew(onSuccess, onError);
    }
    const url = '/admin/_editor/content/save/' + this.state.contentId;

    return fetch(url, {
      body: JSON.stringify(this.getPostBody()),
      credentials: 'include',
      method: 'POST'
    }).then(this.handleFetch)
      .then(onSuccess)
      .catch(error => {
        app.func.showError(error);
        onError(error);
      });
  }

  handleFetch(response) {
    if (!response.ok) {
      throw Error('An error occurred saving this content. Please try again.');
    }

    return response.json();
  }

  getPostBody() {
    const state = this.props.store.getState();
    const blockIds = Object.keys(state.blocks);
    let filteredBlocks = {};
    for (let i=0; i < blockIds.length; i++) {
      let block = state.blocks[blockIds[i]];
      if (!block.isNew) {
        filteredBlocks[blockIds[i]] = block;
      }
    }

    return {
      newBlocks: state.newBlocks,
      blocks: filteredBlocks,
      order: state.order.map(i => {
        // an array with the block id and a unique react key
        // we only want the block id
        return i[0];
      })
    };
  }

  addBlock(e) {
    e.preventDefault();
    this.props.store.dispatch({
      type: 'BLOCK_ADD',
      blockType: 'text'
    });
  }

  render() {
    return (
      <div className={css.editor}>
        <Toolbar save={this.save.bind(this)} add={this.addBlock.bind(this)} />
        <BlockList />
      </div>
    );
  }
}
Editor.childContextTypes = {
  store: PropTypes.object
};

export default Editor;
