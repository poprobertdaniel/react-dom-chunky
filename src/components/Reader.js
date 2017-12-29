import React from 'react'
import Component from '../core/Component'
import Text from './Text'
import { renderResponsive } from '../utils/responsive'
import {
  Select,
  MenuAnchor,
  Button,
  Menu,
  MenuItem,
  List,
  Icon,
  ListItem,
  ListItemStartDetail,
  ListItemText,
  ListItemEndDetail,
  PermanentDrawer,
  PermanentDrawerContent
} from 'rmwc'

export default class Reader extends Component {

  constructor (props) {
    super(props)
    this.state = { ...this.state }
    this._onSectionSelect = (section) => this.onSectionSelect.bind(this, section)
    this._onCompactSectionSelect = this.onCompactSectionSelect.bind(this)
  }

  componentDidMount () {
    super.componentDidMount()
  }

  onSectionSelect (section) {
    this.props.onSectionSelect && this.props.onSectionSelect(section)
  }

  onCompactSectionSelect (e) {
    this.onSectionSelect(this.props.sections[e.detail.index])
  }

  renderSection (section, index) {
    const isSelected = (section.path === this.props.section.path)

    return <ListItem
      key={`section${index}`}
      onClick={this._onSectionSelect(section)}
      style={{
        color: isSelected ? this.props.sectionSelectedColor : this.props.sectionColor
      }}>
      <ListItemText>{section.title}</ListItemText>
    </ListItem>
  }

  renderCompactSection (section, index) {
    return <MenuItem
      key={`section${index}`}>
      { section.menuTitle }
    </MenuItem>
  }

  renderSections () {
    var index = 0
    return <List>
      { this.props.sections.map(section => this.renderSection(section, index++)) }
    </List>
  }

  get compactSections () {
    var index = 0
    return this.props.sections.map(section => this.renderCompactSection(section, index++))
  }

  renderSidebar () {
    return <PermanentDrawer style={{
      alignSelf: 'stretch',
      backgroundColor: this.props.sectionsBackgroundColor}}>
      <PermanentDrawerContent>
        { this.renderSections() }
      </PermanentDrawerContent>
    </PermanentDrawer>
  }

  renderSectionBar () {
    return <div style={{
      backgroundColor: this.props.sectionsBackgroundColor,
      width: '100vw',
      textAlign: 'left',
      paddingLeft: '20px'
    }}>
      <MenuAnchor style={{
        padding: '10px'
      }}>
        <Button
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            color: this.props.sectionSelectedColor
          }}
          onClick={evt => this.setState({'compactMenuIsOpen': !this.state.compactMenuIsOpen})}>
          { this.props.section.menuTitle }
          <Icon use='expand_more' style={{
            color: this.props.sectionSelectedColor
          }} />
        </Button>

        <Menu
          onSelected={this._onCompactSectionSelect}
          open={this.state.compactMenuIsOpen}
          onClose={evt => this.setState({compactMenuIsOpen: false})}>
          {this.compactSections }
        </Menu>
      </MenuAnchor>

    </div>
  }

  renderSectionContent () {
    return <div style={{
      width: '100vw',
      minHeight: '100vh',
      paddingLeft: '20px',
      paddingRight: '20px'
    }}>
      { this.renderBlob() }
    </div>
  }

  renderCompactSectionContent () {
    return this.renderBlob()
  }

  get defaultReader () {
    return <div style={{
      display: 'flex',
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center'
    }}>
      { this.renderSidebar() }
      { this.renderSectionContent() }
    </div>
  }

  get compactReader () {
    return <div style={{
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      { this.renderSectionBar() }
      { this.renderCompactSectionContent() }
    </div>
  }

  renderBlob () {
    return renderResponsive('blob',
      <Text blob={this.props.section.blob} style={{
        width: `90vw`,
        padding: '10px',
        paddingBottom: '60px'
      }} />,
      <Text blob={this.props.section.blob} style={{
        width: `80vw`,
        paddingBottom: '60px'
      }} />)
  }

  renderDefault () {
    if (!this.props.section) {
      return <div />
    }

    return renderResponsive('reader',
      this.compactReader,
      this.defaultReader)
  }

  renderComponent () {
    return this.renderDefault()
  }

  //   return (<div style={{
  //     color: this.props.textColor,
  //     position: 'relative',
  //     display: 'flex',
  //     flex: 1,
  //     flexDirection: 'column',
  //     alignItems: 'center',
  //     justifyContent: 'center' }}>
  //     <img src={`/assets/${this.props.image}`} style={{
  //       width: '200px',
  //       marginTop: '20px',
  //       marginBottom: '-20px'
  //     }} />
  //     { this.renderBlob() }
  //   </div>)
  // }
}
