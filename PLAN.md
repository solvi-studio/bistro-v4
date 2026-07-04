create a refactor plan into only the following nodes (remove excess node types)
  # Node convention
  - <ModifyNode>a scene node</ModifyNode>: non editable sequential and always scene 1 -> scene 2 -> scene 3 -> ... A scene cannot connect to multiple subsequent scene (2 can connect to 1 and 3 but not 3 and 4). Nothing is modifiable here

  - <NewNode>a content node</NewNode>: has a header and an editable text box, colour is fixed and and cannot be changed. Text size is editable

  - <NewNode>a visual node</NewNode>: check specific colour in current code but it should be red bg and red bolder text for header, propose and use a different colour for body text of this node

  - <NewNode>a audio node</NewNode>: check specific colour in current code but it should be blue bg and blue bolder text for header, propose and use a different colour for body text of this node

  - <NewNode>a script node</NewNode>: check specific colour in current code but it should be yellow bg and yellow bolder text for header, propose and use a different colour for body text of this node

  - <ModifyNode>a video node</ModifyNode>: should be using the same colour code as the one from the sidebar

  Each node of these node can only a couple types based on the one suggested on the side bar. For example: visual can only have scene description and shooting style 

  # Connection rule
  Connection between scene should be the scene arrow like currently

  Connection between scene and content should be like currently but arrow should always point from scene outward to the content node

  Even when we drag from sidebar or click from the plus button it should be using these node instead

  # Cursor Menu rule
  when hover over the plus sign we are having a small menu:
  - the first one is scene keep the same but notice the new sequential pattern that we are having
  - the second one is visual: it should have the same items menu as the visual type on the sidebar
  - the third one is audio: it should have the same items menu as the visual type on the sidebar
  - the fourth one is script: it should have the same items menu as the visual type on the sidebar
  connection from these should follow connection rule and not custom arrow rule
