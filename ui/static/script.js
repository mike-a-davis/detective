var svgElem = document.getElementById('diagram')
var svg = d3.select('svg')
console.log(svgElem.height.baseVal.value)
var width = svgElem.width.baseVal.value
var height = svgElem.height.baseVal.value
var g = svg.append('g').attr('transform', 'translate(100,0)')

var tree = d3.tree().size([ height, width - 160 ])

var stratify = d3.stratify()

fetch('/getStatus', {
  method: 'POST',
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  redirect: 'follow',
  referrer: 'no-referrer',
  body: JSON.stringify({
    url: 'http://localhost:8081/'
  })
})
  .then((response) => response.json())
  .then((data) => {
    var normalizedData = []

    function addToNormalizedData (d, parentId) {
      const id = 'n' + normalizedData.length
      normalizedData.push({
        parentId,
        id,
        name: d.name,
        active: d.active,
        status: d.status,
        latency: d.latency
      })
      if (d.dependencies instanceof Array) {
        d.dependencies.forEach((dep) => addToNormalizedData(dep, id))
      }
    }
    addToNormalizedData(data)

    var root = stratify(normalizedData).sort(function (a, b) {
      return a.height - b.height || a.id.localeCompare(b.id)
    })

    var link = g
      .selectAll('.link')
      .data(tree(root).links())
      .enter()
      .append('path')
      .attr('class', (d) => {
        return 'link' + ' ' + (d.target.data.active ? 'link-active' : 'link-inactive')
      })
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x(function (d) {
            return d.y
          })
          .y(function (d) {
            return d.x
          })
      )

    var node = g
      .selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', function (d) {
        let className = d.data.active ? 'active' : 'inactive'
        return className + ' ' + 'node' + (d.children ? ' node--internal' : ' node--leaf')
      })
      .attr('transform', function (d) {
        return 'translate(' + d.y + ',' + d.x + ')'
      })

    node.append('circle').attr('r', 2.5)

    node
      .append('text')
      .attr('dy', 3)
      .attr('x', function (d) {
        return d.children ? -8 : 8
      })
      .style('text-anchor', function (d) {
        return d.children ? 'end' : 'start'
      })
      .text(function (d) {
        return d.data.name
      })
  })