(function () {
  'use strict';

  const GPX_11_NS = 'http://www.topografix.com/GPX/1/1';
  const GPX_10_NS = 'http://www.topografix.com/GPX/1/0';
  const NON_ESSENTIAL_TAGS = new Set([
    'cmt',
    'src',
    'link',
    'magvar',
    'geoidheight',
    'fix',
    'sat',
    'hdop',
    'vdop',
    'pdop',
    'ageofdgpsdata',
    'dgpsid',
    'number'
  ]);

  const GPX_POINT_CHILD_ORDER = [
    'ele',
    'time',
    'magvar',
    'geoidheight',
    'name',
    'cmt',
    'desc',
    'src',
    'link',
    'sym',
    'type',
    'fix',
    'sat',
    'hdop',
    'vdop',
    'pdop',
    'ageofdgpsdata',
    'dgpsid',
    'extensions'
  ];

  const COURSE_POINT_TYPES = {
    0: 'Generic',
    1: 'Summit',
    2: 'Valley',
    3: 'Water',
    4: 'Food',
    5: 'Danger',
    6: 'Left',
    7: 'Right',
    8: 'Straight',
    9: 'First Aid',
    10: '4th Category',
    11: '3rd Category',
    12: '2nd Category',
    13: '1st Category',
    14: 'Hors Category',
    15: 'Sprint',
    16: 'Left Fork',
    17: 'Right Fork',
    18: 'Middle Fork',
    19: 'Slight Left',
    20: 'Sharp Left',
    21: 'Slight Right',
    22: 'Sharp Right',
    23: 'U-Turn'
  };

  const SAMPLE_GPX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Builder" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Cycle on the Moss</name>
    <desc>Distance: 53.00 km | Elevation Gain: +203m | Elevation Loss: -203m</desc>
    <time>2026-11-18T15:10:34.125Z</time>
  </metadata>
  <trk>
    <name>Cycle on the Moss</name>
    <trkseg>
      <trkpt lat="53.476745" lon="-3.024770">
        <ele>14.0</ele>
        <name>WP0001</name>
      </trkpt>
      <trkpt lat="53.475890" lon="-3.023708">
        <ele>13.0</ele>
        <name>WP0002</name>
      </trkpt>
      <trkpt lat="53.473048" lon="-3.030038">
        <ele>7.0</ele>
        <name>WP0003</name>
      </trkpt>
      <trkpt lat="53.476151" lon="-3.034544">
        <ele>11.0</ele>
        <name>WP0004</name>
      </trkpt>
      <trkpt lat="53.477313" lon="-3.036851">
        <ele>7.0</ele>
        <name>WP0005</name>
      </trkpt>
      <trkpt lat="53.477141" lon="-3.037194">
        <ele>7.0</ele>
        <name>WP0006</name>
      </trkpt>
      <trkpt lat="53.477192" lon="-3.037602">
        <ele>6.0</ele>
        <name>WP0007</name>
      </trkpt>
      <trkpt lat="53.477831" lon="-3.038664">
        <ele>9.0</ele>
        <name>WP0008</name>
      </trkpt>
      <trkpt lat="53.479957" lon="-3.041604">
        <ele>7.0</ele>
        <name>WP0009</name>
      </trkpt>
      <trkpt lat="53.480353" lon="-3.042537">
        <ele>7.0</ele>
        <name>WP0010</name>
      </trkpt>
      <trkpt lat="53.481744" lon="-3.044082">
        <ele>9.0</ele>
        <name>WP0011</name>
      </trkpt>
      <trkpt lat="53.481438" lon="-3.045058">
        <ele>7.0</ele>
        <name>WP0012</name>
      </trkpt>
      <trkpt lat="53.481872" lon="-3.045809">
        <ele>7.0</ele>
        <name>WP0013</name>
      </trkpt>
      <trkpt lat="53.482211" lon="-3.045756">
        <ele>7.0</ele>
        <name>WP0014</name>
      </trkpt>
      <trkpt lat="53.482855" lon="-3.044297">
        <ele>9.0</ele>
        <name>WP0015</name>
      </trkpt>
      <trkpt lat="53.484854" lon="-3.046474">
        <ele>9.0</ele>
        <name>WP0016</name>
      </trkpt>
      <trkpt lat="53.484981" lon="-3.046228">
        <ele>9.0</ele>
        <name>WP0017</name>
      </trkpt>
      <trkpt lat="53.489361" lon="-3.051420">
        <ele>9.0</ele>
        <name>WP0018</name>
      </trkpt>
      <trkpt lat="53.489858" lon="-3.052568">
        <ele>8.0</ele>
        <name>WP0019</name>
      </trkpt>
      <trkpt lat="53.490669" lon="-3.053641">
        <ele>8.0</ele>
        <name>WP0020</name>
      </trkpt>
      <trkpt lat="53.491550" lon="-3.054199">
        <ele>8.0</ele>
        <name>WP0021</name>
      </trkpt>
      <trkpt lat="53.492278" lon="-3.054188">
        <ele>8.0</ele>
        <name>WP0022</name>
      </trkpt>
      <trkpt lat="53.496637" lon="-3.056989">
        <ele>9.0</ele>
        <name>WP0023</name>
      </trkpt>
      <trkpt lat="53.496745" lon="-3.057654">
        <ele>6.0</ele>
        <name>WP0024</name>
      </trkpt>
      <trkpt lat="53.496669" lon="-3.058394">
        <ele>6.0</ele>
        <name>WP0025</name>
      </trkpt>
      <trkpt lat="53.497613" lon="-3.058748">
        <ele>7.0</ele>
        <name>WP0026</name>
      </trkpt>
      <trkpt lat="53.497933" lon="-3.058609">
        <ele>7.0</ele>
        <name>WP0027</name>
      </trkpt>
      <trkpt lat="53.499694" lon="-3.059371">
        <ele>5.0</ele>
        <name>WP0028</name>
      </trkpt>
      <trkpt lat="53.500115" lon="-3.059886">
        <ele>7.0</ele>
        <name>WP0029</name>
      </trkpt>
      <trkpt lat="53.506458" lon="-3.062214">
        <ele>5.0</ele>
        <name>WP0030</name>
      </trkpt>
      <trkpt lat="53.507281" lon="-3.061870">
        <ele>3.0</ele>
        <name>WP0031</name>
      </trkpt>
      <trkpt lat="53.508321" lon="-3.061924">
        <ele>4.0</ele>
        <name>WP0032</name>
      </trkpt>
      <trkpt lat="53.509891" lon="-3.062375">
        <ele>7.0</ele>
        <name>WP0033</name>
      </trkpt>
      <trkpt lat="53.510937" lon="-3.062278">
        <ele>8.0</ele>
        <name>WP0034</name>
      </trkpt>
      <trkpt lat="53.512232" lon="-3.062890">
        <ele>3.0</ele>
        <name>WP0035</name>
      </trkpt>
      <trkpt lat="53.512660" lon="-3.062160">
        <ele>7.0</ele>
        <name>WP0036</name>
      </trkpt>
      <trkpt lat="53.512379" lon="-3.060282">
        <ele>8.0</ele>
        <name>WP0037</name>
      </trkpt>
      <trkpt lat="53.512475" lon="-3.058534">
        <ele>8.0</ele>
        <name>WP0038</name>
      </trkpt>
      <trkpt lat="53.513081" lon="-3.058813">
        <ele>7.0</ele>
        <name>WP0039</name>
      </trkpt>
      <trkpt lat="53.514165" lon="-3.058791">
        <ele>8.0</ele>
        <name>WP0040</name>
      </trkpt>
      <trkpt lat="53.514523" lon="-3.058223">
        <ele>8.0</ele>
        <name>WP0041</name>
      </trkpt>
      <trkpt lat="53.515594" lon="-3.057632">
        <ele>8.0</ele>
        <name>WP0042</name>
      </trkpt>
      <trkpt lat="53.519173" lon="-3.057311">
        <ele>9.0</ele>
        <name>WP0043</name>
      </trkpt>
      <trkpt lat="53.519945" lon="-3.056999">
        <ele>9.0</ele>
        <name>WP0044</name>
      </trkpt>
      <trkpt lat="53.520621" lon="-3.056989">
        <ele>8.0</ele>
        <name>WP0045</name>
      </trkpt>
      <trkpt lat="53.521195" lon="-3.057193">
        <ele>9.0</ele>
        <name>WP0046</name>
      </trkpt>
      <trkpt lat="53.521450" lon="-3.057740">
        <ele>10.0</ele>
        <name>WP0047</name>
      </trkpt>
      <trkpt lat="53.523211" lon="-3.058137">
        <ele>8.0</ele>
        <name>WP0048</name>
      </trkpt>
      <trkpt lat="53.523759" lon="-3.057965">
        <ele>9.0</ele>
        <name>WP0049</name>
      </trkpt>
      <trkpt lat="53.524786" lon="-3.058201">
        <ele>8.6</ele>
        <name>WP0050</name>
      </trkpt>
      <trkpt lat="53.524856" lon="-3.057429">
        <ele>9.0</ele>
        <name>WP0051</name>
      </trkpt>
      <trkpt lat="53.525685" lon="-3.057536">
        <ele>7.0</ele>
        <name>WP0052</name>
      </trkpt>
      <trkpt lat="53.528313" lon="-3.058469">
        <ele>7.0</ele>
        <name>WP0053</name>
      </trkpt>
      <trkpt lat="53.532286" lon="-3.060540">
        <ele>4.0</ele>
        <name>WP0054</name>
      </trkpt>
      <trkpt lat="53.543584" lon="-3.067009">
        <ele>5.0</ele>
        <name>WP0055</name>
      </trkpt>
      <trkpt lat="53.544082" lon="-3.067632">
        <ele>3.0</ele>
        <name>WP0056</name>
      </trkpt>
      <trkpt lat="53.543533" lon="-3.068812">
        <ele>3.0</ele>
        <name>WP0057</name>
      </trkpt>
      <trkpt lat="53.543597" lon="-3.069499">
        <ele>3.0</ele>
        <name>WP0058</name>
      </trkpt>
      <trkpt lat="53.545444" lon="-3.071098">
        <ele>30.4</ele>
        <name>WP0059</name>
      </trkpt>
      <trkpt lat="53.547420" lon="-3.070994">
        <ele>32.0</ele>
        <name>WP0060</name>
      </trkpt>
      <trkpt lat="53.549852" lon="-3.071401">
        <ele>32.8</ele>
        <name>WP0061</name>
      </trkpt>
      <trkpt lat="53.550881" lon="-3.071163">
        <ele>34.4</ele>
        <name>WP0062</name>
      </trkpt>
      <trkpt lat="53.551259" lon="-3.071014">
        <ele>34.8</ele>
        <name>WP0063</name>
      </trkpt>
      <trkpt lat="53.551283" lon="-3.070017">
        <ele>34.0</ele>
        <name>WP0064</name>
      </trkpt>
      <trkpt lat="53.553128" lon="-3.070114">
        <ele>34.4</ele>
        <name>WP0065</name>
      </trkpt>
      <trkpt lat="53.553235" lon="-3.068994">
        <ele>34.4</ele>
        <name>WP0066</name>
      </trkpt>
      <trkpt lat="53.553434" lon="-3.068514">
        <ele>34.2</ele>
        <name>WP0067</name>
      </trkpt>
      <trkpt lat="53.553796" lon="-3.068224">
        <ele>34.4</ele>
        <name>WP0068</name>
      </trkpt>
      <trkpt lat="53.554475" lon="-3.068557">
        <ele>34.8</ele>
        <name>WP0069</name>
      </trkpt>
      <trkpt lat="53.554570" lon="-3.069472">
        <ele>35.0</ele>
        <name>WP0070</name>
      </trkpt>
      <trkpt lat="53.556035" lon="-3.070252">
        <ele>35.0</ele>
        <name>WP0071</name>
      </trkpt>
      <trkpt lat="53.554576" lon="-3.069472">
        <ele>31.2</ele>
        <name>WP0072</name>
      </trkpt>
      <trkpt lat="53.554619" lon="-3.068287">
        <ele>31.4</ele>
        <name>WP0073</name>
      </trkpt>
      <trkpt lat="53.556043" lon="-3.064851">
        <ele>31.0</ele>
        <name>WP0074</name>
      </trkpt>
      <trkpt lat="53.557056" lon="-3.060394">
        <ele>30.8</ele>
        <name>WP0075</name>
      </trkpt>
      <trkpt lat="53.557672" lon="-3.058910">
        <ele>31.0</ele>
        <name>WP0076</name>
      </trkpt>
      <trkpt lat="53.557845" lon="-3.056619">
        <ele>31.0</ele>
        <name>WP0077</name>
      </trkpt>
      <trkpt lat="53.559227" lon="-3.056754">
        <ele>30.4</ele>
        <name>WP0078</name>
      </trkpt>
      <trkpt lat="53.559024" lon="-3.053057">
        <ele>30.8</ele>
        <name>WP0079</name>
      </trkpt>
      <trkpt lat="53.560660" lon="-3.052770">
        <ele>30.2</ele>
        <name>WP0080</name>
      </trkpt>
      <trkpt lat="53.562066" lon="-3.051168">
        <ele>30.6</ele>
        <name>WP0081</name>
      </trkpt>
      <trkpt lat="53.563154" lon="-3.049311">
        <ele>30.4</ele>
        <name>WP0082</name>
      </trkpt>
      <trkpt lat="53.563121" lon="-3.046554">
        <ele>30.0</ele>
        <name>WP0083</name>
      </trkpt>
      <trkpt lat="53.563287" lon="-3.046295">
        <ele>30.6</ele>
        <name>WP0084</name>
      </trkpt>
      <trkpt lat="53.562922" lon="-3.046240">
        <ele>31.0</ele>
        <name>WP0085</name>
      </trkpt>
      <trkpt lat="53.563101" lon="-3.045762">
        <ele>29.6</ele>
        <name>WP0086</name>
      </trkpt>
      <trkpt lat="53.562990" lon="-3.043827">
        <ele>30.0</ele>
        <name>WP0087</name>
      </trkpt>
      <trkpt lat="53.562372" lon="-3.040703">
        <ele>31.4</ele>
        <name>WP0088</name>
      </trkpt>
      <trkpt lat="53.562325" lon="-3.037928">
        <ele>29.0</ele>
        <name>WP0089</name>
      </trkpt>
      <trkpt lat="53.564755" lon="-3.030913">
        <ele>29.6</ele>
        <name>WP0090</name>
      </trkpt>
      <trkpt lat="53.565567" lon="-3.021417">
        <ele>30.0</ele>
        <name>WP0091</name>
      </trkpt>
      <trkpt lat="53.569413" lon="-3.007602">
        <ele>28.2</ele>
        <name>WP0092</name>
      </trkpt>
      <trkpt lat="53.569263" lon="-3.007177">
        <ele>26.8</ele>
        <name>WP0093</name>
      </trkpt>
      <trkpt lat="53.567937" lon="-3.006011">
        <ele>27.4</ele>
        <name>WP0094</name>
      </trkpt>
      <trkpt lat="53.566740" lon="-3.003594">
        <ele>27.6</ele>
        <name>WP0095</name>
      </trkpt>
      <trkpt lat="53.565932" lon="-2.999293">
        <ele>28.4</ele>
        <name>WP0096</name>
      </trkpt>
      <trkpt lat="53.566081" lon="-2.996585">
        <ele>29.6</ele>
        <name>WP0097</name>
      </trkpt>
      <trkpt lat="53.565552" lon="-2.993533">
        <ele>30.2</ele>
        <name>WP0098</name>
      </trkpt>
      <trkpt lat="53.565137" lon="-2.992462">
        <ele>33.8</ele>
        <name>WP0099</name>
      </trkpt>
      <trkpt lat="53.562499" lon="-2.987625">
        <ele>30.4</ele>
        <name>WP0100</name>
      </trkpt>
      <trkpt lat="53.563859" lon="-2.983076">
        <ele>31.6</ele>
        <name>WP0101</name>
      </trkpt>
      <trkpt lat="53.564419" lon="-2.980005">
        <ele>33.2</ele>
        <name>WP0102</name>
      </trkpt>
      <trkpt lat="53.564519" lon="-2.978862">
        <ele>34.2</ele>
        <name>WP0103</name>
      </trkpt>
      <trkpt lat="53.564044" lon="-2.976304">
        <ele>36.0</ele>
        <name>WP0104</name>
      </trkpt>
      <trkpt lat="53.564987" lon="-2.970773">
        <ele>38.2</ele>
        <name>WP0105</name>
      </trkpt>
      <trkpt lat="53.564907" lon="-2.969651">
        <ele>39.4</ele>
        <name>WP0106</name>
      </trkpt>
      <trkpt lat="53.565645" lon="-2.969175">
        <ele>39.0</ele>
        <name>WP0107</name>
      </trkpt>
      <trkpt lat="53.565838" lon="-2.968714">
        <ele>39.4</ele>
        <name>WP0108</name>
      </trkpt>
      <trkpt lat="53.565404" lon="-2.963945">
        <ele>40.4</ele>
        <name>WP0109</name>
      </trkpt>
      <trkpt lat="53.566208" lon="-2.961922">
        <ele>40.4</ele>
        <name>WP0110</name>
      </trkpt>
      <trkpt lat="53.566297" lon="-2.960978">
        <ele>41.0</ele>
        <name>WP0111</name>
      </trkpt>
      <trkpt lat="53.566135" lon="-2.959008">
        <ele>39.8</ele>
        <name>WP0112</name>
      </trkpt>
      <trkpt lat="53.565589" lon="-2.957619">
        <ele>42.0</ele>
        <name>WP0113</name>
      </trkpt>
      <trkpt lat="53.563579" lon="-2.957307">
        <ele>41.4</ele>
        <name>WP0114</name>
      </trkpt>
      <trkpt lat="53.563047" lon="-2.956795">
        <ele>44.0</ele>
        <name>WP0115</name>
      </trkpt>
      <trkpt lat="53.562550" lon="-2.955132">
        <ele>42.6</ele>
        <name>WP0116</name>
      </trkpt>
      <trkpt lat="53.561308" lon="-2.952848">
        <ele>43.6</ele>
        <name>WP0117</name>
      </trkpt>
      <trkpt lat="53.561638" lon="-2.951288">
        <ele>44.4</ele>
        <name>WP0118</name>
      </trkpt>
      <trkpt lat="53.561575" lon="-2.950936">
        <ele>44.0</ele>
        <name>WP0119</name>
      </trkpt>
      <trkpt lat="53.560708" lon="-2.949344">
        <ele>44.8</ele>
        <name>WP0120</name>
      </trkpt>
      <trkpt lat="53.559975" lon="-2.949441">
        <ele>43.0</ele>
        <name>WP0121</name>
      </trkpt>
      <trkpt lat="53.558638" lon="-2.946602">
        <ele>44.4</ele>
        <name>WP0122</name>
      </trkpt>
      <trkpt lat="53.561367" lon="-2.942448">
        <ele>45.6</ele>
        <name>WP0123</name>
      </trkpt>
      <trkpt lat="53.562438" lon="-2.941589">
        <ele>45.8</ele>
        <name>WP0124</name>
      </trkpt>
      <trkpt lat="53.564885" lon="-2.942705">
        <ele>45.8</ele>
        <name>WP0125</name>
      </trkpt>
      <trkpt lat="53.566516" lon="-2.941589">
        <ele>46.0</ele>
        <name>WP0126</name>
      </trkpt>
      <trkpt lat="53.566644" lon="-2.939916">
        <ele>49.8</ele>
        <name>WP0127</name>
      </trkpt>
      <trkpt lat="53.565802" lon="-2.938457">
        <ele>51.0</ele>
        <name>WP0128</name>
      </trkpt>
      <trkpt lat="53.565751" lon="-2.936225">
        <ele>51.0</ele>
        <name>WP0129</name>
      </trkpt>
      <trkpt lat="53.565828" lon="-2.934380">
        <ele>55.8</ele>
        <name>WP0130</name>
      </trkpt>
      <trkpt lat="53.565650" lon="-2.931890">
        <ele>59.0</ele>
        <name>WP0131</name>
      </trkpt>
      <trkpt lat="53.564808" lon="-2.929316">
        <ele>64.2</ele>
        <name>WP0132</name>
      </trkpt>
      <trkpt lat="53.564918" lon="-2.929321">
        <ele>69.2</ele>
        <name>WP0133</name>
      </trkpt>
      <trkpt lat="53.567189" lon="-2.930034">
        <ele>69.0</ele>
        <name>WP0134</name>
      </trkpt>
      <trkpt lat="53.568839" lon="-2.929193">
        <ele>58.4</ele>
        <name>WP0135</name>
      </trkpt>
      <trkpt lat="53.571420" lon="-2.930357">
        <ele>48.0</ele>
        <name>WP0136</name>
      </trkpt>
      <trkpt lat="53.574117" lon="-2.936397">
        <ele>39.8</ele>
        <name>WP0137</name>
      </trkpt>
      <trkpt lat="53.575734" lon="-2.938938">
        <ele>37.6</ele>
        <name>WP0138</name>
      </trkpt>
      <trkpt lat="53.576430" lon="-2.941515">
        <ele>35.6</ele>
        <name>WP0139</name>
      </trkpt>
      <trkpt lat="53.577869" lon="-2.941048">
        <ele>35.6</ele>
        <name>WP0140</name>
      </trkpt>
      <trkpt lat="53.578665" lon="-2.941165">
        <ele>35.6</ele>
        <name>WP0141</name>
      </trkpt>
      <trkpt lat="53.579414" lon="-2.940194">
        <ele>35.8</ele>
        <name>WP0142</name>
      </trkpt>
      <trkpt lat="53.581366" lon="-2.944845">
        <ele>35.4</ele>
        <name>WP0143</name>
      </trkpt>
      <trkpt lat="53.581952" lon="-2.945712">
        <ele>37.0</ele>
        <name>WP0144</name>
      </trkpt>
      <trkpt lat="53.582769" lon="-2.946210">
        <ele>34.0</ele>
        <name>WP0145</name>
      </trkpt>
      <trkpt lat="53.583849" lon="-2.947738">
        <ele>34.4</ele>
        <name>WP0146</name>
      </trkpt>
      <trkpt lat="53.585067" lon="-2.951340">
        <ele>33.6</ele>
        <name>WP0147</name>
      </trkpt>
      <trkpt lat="53.584993" lon="-2.953285">
        <ele>32.8</ele>
        <name>WP0148</name>
      </trkpt>
      <trkpt lat="53.584275" lon="-2.954548">
        <ele>32.0</ele>
        <name>WP0149</name>
      </trkpt>
      <trkpt lat="53.582962" lon="-2.956058">
        <ele>32.2</ele>
        <name>WP0150</name>
      </trkpt>
      <trkpt lat="53.582147" lon="-2.960509">
        <ele>32.2</ele>
        <name>WP0151</name>
      </trkpt>
      <trkpt lat="53.583916" lon="-2.964854">
        <ele>31.6</ele>
        <name>WP0152</name>
      </trkpt>
      <trkpt lat="53.585608" lon="-2.970644">
        <ele>25.4</ele>
        <name>WP0153</name>
      </trkpt>
      <trkpt lat="53.585698" lon="-2.971309">
        <ele>24.8</ele>
        <name>WP0154</name>
      </trkpt>
      <trkpt lat="53.585586" lon="-2.977495">
        <ele>24.8</ele>
        <name>WP0155</name>
      </trkpt>
      <trkpt lat="53.585683" lon="-2.979233">
        <ele>24.8</ele>
        <name>WP0156</name>
      </trkpt>
      <trkpt lat="53.586028" lon="-2.981170">
        <ele>23.8</ele>
        <name>WP0157</name>
      </trkpt>
      <trkpt lat="53.588952" lon="-2.986763">
        <ele>22.4</ele>
        <name>WP0158</name>
      </trkpt>
      <trkpt lat="53.590380" lon="-2.990876">
        <ele>21.6</ele>
        <name>WP0159</name>
      </trkpt>
      <trkpt lat="53.592357" lon="-2.995190">
        <ele>22.2</ele>
        <name>WP0160</name>
      </trkpt>
      <trkpt lat="53.596511" lon="-2.996720">
        <ele>21.0</ele>
        <name>WP0161</name>
      </trkpt>
      <trkpt lat="53.597093" lon="-2.998933">
        <ele>20.0</ele>
        <name>WP0162</name>
      </trkpt>
      <trkpt lat="53.597819" lon="-3.010322">
        <ele>21.2</ele>
        <name>WP0163</name>
      </trkpt>
      <trkpt lat="53.598642" lon="-3.014951">
        <ele>20.8</ele>
        <name>WP0164</name>
      </trkpt>
      <trkpt lat="53.599255" lon="-3.019696">
        <ele>20.6</ele>
        <name>WP0165</name>
      </trkpt>
      <trkpt lat="53.600065" lon="-3.023978">
        <ele>21.6</ele>
        <name>WP0166</name>
      </trkpt>
      <trkpt lat="53.601933" lon="-3.028898">
        <ele>23.6</ele>
        <name>WP0167</name>
      </trkpt>
      <trkpt lat="53.603253" lon="-3.031335">
        <ele>27.8</ele>
        <name>WP0168</name>
      </trkpt>
      <trkpt lat="53.602953" lon="-3.034002">
        <ele>12.0</ele>
        <name>WP0169</name>
      </trkpt>
      <trkpt lat="53.602574" lon="-3.035354">
        <ele>12.0</ele>
        <name>WP0170</name>
      </trkpt>
      <trkpt lat="53.602170" lon="-3.038439">
        <ele>13.0</ele>
        <name>WP0171</name>
      </trkpt>
      <trkpt lat="53.602030" lon="-3.040563">
        <ele>13.0</ele>
        <name>WP0172</name>
      </trkpt>
      <trkpt lat="53.602189" lon="-3.042129">
        <ele>13.0</ele>
        <name>WP0173</name>
      </trkpt>
      <trkpt lat="53.599764" lon="-3.044447">
        <ele>14.0</ele>
        <name>WP0174</name>
      </trkpt>
      <trkpt lat="53.599356" lon="-3.043149">
        <ele>12.0</ele>
        <name>WP0175</name>
      </trkpt>
      <trkpt lat="53.599254" lon="-3.041518">
        <ele>12.0</ele>
        <name>WP0176</name>
      </trkpt>
      <trkpt lat="53.598573" lon="-3.039554">
        <ele>11.0</ele>
        <name>WP0177</name>
      </trkpt>
      <trkpt lat="53.597745" lon="-3.039951">
        <ele>10.0</ele>
        <name>WP0178</name>
      </trkpt>
      <trkpt lat="53.597280" lon="-3.037387">
        <ele>9.0</ele>
        <name>WP0179</name>
      </trkpt>
      <trkpt lat="53.596917" lon="-3.036325">
        <ele>9.0</ele>
        <name>WP0180</name>
      </trkpt>
      <trkpt lat="53.594450" lon="-3.038646">
        <ele>27.6</ele>
        <name>WP0181</name>
      </trkpt>
      <trkpt lat="53.593976" lon="-3.038864">
        <ele>27.4</ele>
        <name>WP0182</name>
      </trkpt>
      <trkpt lat="53.590794" lon="-3.039059">
        <ele>27.2</ele>
        <name>WP0183</name>
      </trkpt>
      <trkpt lat="53.587276" lon="-3.041016">
        <ele>26.4</ele>
        <name>WP0184</name>
      </trkpt>
      <trkpt lat="53.585604" lon="-3.043589">
        <ele>27.6</ele>
        <name>WP0185</name>
      </trkpt>
      <trkpt lat="53.580695" lon="-3.048768">
        <ele>27.2</ele>
        <name>WP0186</name>
      </trkpt>
      <trkpt lat="53.578604" lon="-3.050382">
        <ele>27.4</ele>
        <name>WP0187</name>
      </trkpt>
      <trkpt lat="53.577027" lon="-3.051028">
        <ele>26.2</ele>
        <name>WP0188</name>
      </trkpt>
      <trkpt lat="53.575197" lon="-3.051266">
        <ele>25.8</ele>
        <name>WP0189</name>
      </trkpt>
      <trkpt lat="53.573595" lon="-3.051023">
        <ele>24.4</ele>
        <name>WP0190</name>
      </trkpt>
      <trkpt lat="53.571933" lon="-3.050285">
        <ele>25.2</ele>
        <name>WP0191</name>
      </trkpt>
      <trkpt lat="53.571703" lon="-3.050973">
        <ele>24.6</ele>
        <name>WP0192</name>
      </trkpt>
      <trkpt lat="53.571305" lon="-3.051035">
        <ele>24.0</ele>
        <name>WP0193</name>
      </trkpt>
      <trkpt lat="53.569961" lon="-3.056734">
        <ele>24.4</ele>
        <name>WP0194</name>
      </trkpt>
      <trkpt lat="53.569983" lon="-3.057035">
        <ele>24.4</ele>
        <name>WP0195</name>
      </trkpt>
      <trkpt lat="53.570561" lon="-3.057572">
        <ele>24.6</ele>
        <name>WP0196</name>
      </trkpt>
      <trkpt lat="53.570347" lon="-3.058654">
        <ele>24.8</ele>
        <name>WP0197</name>
      </trkpt>
      <trkpt lat="53.570543" lon="-3.059025">
        <ele>25.2</ele>
        <name>WP0198</name>
      </trkpt>
      <trkpt lat="53.569814" lon="-3.064304">
        <ele>25.0</ele>
        <name>WP0199</name>
      </trkpt>
      <trkpt lat="53.568829" lon="-3.064066">
        <ele>25.6</ele>
        <name>WP0200</name>
      </trkpt>
      <trkpt lat="53.568630" lon="-3.066432">
        <ele>25.0</ele>
        <name>WP0201</name>
      </trkpt>
      <trkpt lat="53.568413" lon="-3.067443">
        <ele>25.6</ele>
        <name>WP0202</name>
      </trkpt>
      <trkpt lat="53.568068" lon="-3.067523">
        <ele>25.2</ele>
        <name>WP0203</name>
      </trkpt>
      <trkpt lat="53.566815" lon="-3.067061">
        <ele>25.4</ele>
        <name>WP0204</name>
      </trkpt>
      <trkpt lat="53.564779" lon="-3.065281">
        <ele>25.6</ele>
        <name>WP0205</name>
      </trkpt>
      <trkpt lat="53.563772" lon="-3.070406">
        <ele>25.2</ele>
        <name>WP0206</name>
      </trkpt>
      <trkpt lat="53.557884" lon="-3.068555">
        <ele>24.8</ele>
        <name>WP0207</name>
      </trkpt>
      <trkpt lat="53.554579" lon="-3.068527">
        <ele>25.6</ele>
        <name>WP0208</name>
      </trkpt>
      <trkpt lat="53.553670" lon="-3.068060">
        <ele>25.6</ele>
        <name>WP0209</name>
      </trkpt>
      <trkpt lat="53.552989" lon="-3.073768">
        <ele>24.8</ele>
        <name>WP0210</name>
      </trkpt>
      <trkpt lat="53.553060" lon="-3.071106">
        <ele>24.4</ele>
        <name>WP0211</name>
      </trkpt>
      <trkpt lat="53.551166" lon="-3.070935">
        <ele>25.2</ele>
        <name>WP0212</name>
      </trkpt>
      <trkpt lat="53.549475" lon="-3.071327">
        <ele>24.6</ele>
        <name>WP0213</name>
      </trkpt>
      <trkpt lat="53.547111" lon="-3.070961">
        <ele>23.2</ele>
        <name>WP0214</name>
      </trkpt>
      <trkpt lat="53.545621" lon="-3.071108">
        <ele>22.6</ele>
        <name>WP0215</name>
      </trkpt>
      <trkpt lat="53.545076" lon="-3.070936">
        <ele>6.0</ele>
        <name>WP0216</name>
      </trkpt>
      <trkpt lat="53.543597" lon="-3.069499">
        <ele>3.0</ele>
        <name>WP0217</name>
      </trkpt>
      <trkpt lat="53.543533" lon="-3.068812">
        <ele>3.0</ele>
        <name>WP0218</name>
      </trkpt>
      <trkpt lat="53.544082" lon="-3.067632">
        <ele>3.0</ele>
        <name>WP0219</name>
      </trkpt>
      <trkpt lat="53.543584" lon="-3.067009">
        <ele>5.0</ele>
        <name>WP0220</name>
      </trkpt>
      <trkpt lat="53.532286" lon="-3.060540">
        <ele>4.0</ele>
        <name>WP0221</name>
      </trkpt>
      <trkpt lat="53.528313" lon="-3.058469">
        <ele>7.0</ele>
        <name>WP0222</name>
      </trkpt>
      <trkpt lat="53.525685" lon="-3.057536">
        <ele>7.0</ele>
        <name>WP0223</name>
      </trkpt>
      <trkpt lat="53.524856" lon="-3.057429">
        <ele>9.0</ele>
        <name>WP0224</name>
      </trkpt>
      <trkpt lat="53.524786" lon="-3.058201">
        <ele>8.0</ele>
        <name>WP0225</name>
      </trkpt>
      <trkpt lat="53.523759" lon="-3.057965">
        <ele>9.0</ele>
        <name>WP0226</name>
      </trkpt>
      <trkpt lat="53.523211" lon="-3.058137">
        <ele>8.0</ele>
        <name>WP0227</name>
      </trkpt>
      <trkpt lat="53.521450" lon="-3.057740">
        <ele>10.0</ele>
        <name>WP0228</name>
      </trkpt>
      <trkpt lat="53.521195" lon="-3.057193">
        <ele>9.0</ele>
        <name>WP0229</name>
      </trkpt>
      <trkpt lat="53.520621" lon="-3.056989">
        <ele>8.0</ele>
        <name>WP0230</name>
      </trkpt>
      <trkpt lat="53.519945" lon="-3.056999">
        <ele>9.0</ele>
        <name>WP0231</name>
      </trkpt>
      <trkpt lat="53.519173" lon="-3.057311">
        <ele>9.0</ele>
        <name>WP0232</name>
      </trkpt>
      <trkpt lat="53.515594" lon="-3.057632">
        <ele>8.0</ele>
        <name>WP0233</name>
      </trkpt>
      <trkpt lat="53.514523" lon="-3.058223">
        <ele>8.0</ele>
        <name>WP0234</name>
      </trkpt>
      <trkpt lat="53.514165" lon="-3.058791">
        <ele>8.0</ele>
        <name>WP0235</name>
      </trkpt>
      <trkpt lat="53.513081" lon="-3.058813">
        <ele>7.0</ele>
        <name>WP0236</name>
      </trkpt>
      <trkpt lat="53.512475" lon="-3.058534">
        <ele>8.0</ele>
        <name>WP0237</name>
      </trkpt>
      <trkpt lat="53.512379" lon="-3.060282">
        <ele>8.0</ele>
        <name>WP0238</name>
      </trkpt>
      <trkpt lat="53.512660" lon="-3.062160">
        <ele>7.0</ele>
        <name>WP0239</name>
      </trkpt>
      <trkpt lat="53.512232" lon="-3.062890">
        <ele>3.0</ele>
        <name>WP0240</name>
      </trkpt>
      <trkpt lat="53.510937" lon="-3.062278">
        <ele>8.0</ele>
        <name>WP0241</name>
      </trkpt>
      <trkpt lat="53.509891" lon="-3.062375">
        <ele>7.0</ele>
        <name>WP0242</name>
      </trkpt>
      <trkpt lat="53.508321" lon="-3.061924">
        <ele>4.0</ele>
        <name>WP0243</name>
      </trkpt>
      <trkpt lat="53.507281" lon="-3.061870">
        <ele>3.0</ele>
        <name>WP0244</name>
      </trkpt>
      <trkpt lat="53.506458" lon="-3.062214">
        <ele>5.0</ele>
        <name>WP0245</name>
      </trkpt>
      <trkpt lat="53.500115" lon="-3.059886">
        <ele>7.0</ele>
        <name>WP0246</name>
      </trkpt>
      <trkpt lat="53.499694" lon="-3.059371">
        <ele>5.0</ele>
        <name>WP0247</name>
      </trkpt>
      <trkpt lat="53.497933" lon="-3.058609">
        <ele>7.0</ele>
        <name>WP0248</name>
      </trkpt>
      <trkpt lat="53.497613" lon="-3.058748">
        <ele>7.0</ele>
        <name>WP0249</name>
      </trkpt>
      <trkpt lat="53.496669" lon="-3.058394">
        <ele>6.0</ele>
        <name>WP0250</name>
      </trkpt>
      <trkpt lat="53.496745" lon="-3.057654">
        <ele>6.0</ele>
        <name>WP0251</name>
      </trkpt>
      <trkpt lat="53.496637" lon="-3.056989">
        <ele>9.0</ele>
        <name>WP0252</name>
      </trkpt>
      <trkpt lat="53.492278" lon="-3.054188">
        <ele>8.0</ele>
        <name>WP0253</name>
      </trkpt>
      <trkpt lat="53.491550" lon="-3.054199">
        <ele>8.0</ele>
        <name>WP0254</name>
      </trkpt>
      <trkpt lat="53.490669" lon="-3.053641">
        <ele>8.0</ele>
        <name>WP0255</name>
      </trkpt>
      <trkpt lat="53.489858" lon="-3.052568">
        <ele>8.0</ele>
        <name>WP0256</name>
      </trkpt>
      <trkpt lat="53.489361" lon="-3.051420">
        <ele>9.0</ele>
        <name>WP0257</name>
      </trkpt>
      <trkpt lat="53.484981" lon="-3.046228">
        <ele>9.0</ele>
        <name>WP0258</name>
      </trkpt>
      <trkpt lat="53.484854" lon="-3.046474">
        <ele>9.0</ele>
        <name>WP0259</name>
      </trkpt>
      <trkpt lat="53.482855" lon="-3.044297">
        <ele>9.0</ele>
        <name>WP0260</name>
      </trkpt>
      <trkpt lat="53.482211" lon="-3.045756">
        <ele>7.0</ele>
        <name>WP0261</name>
      </trkpt>
      <trkpt lat="53.481872" lon="-3.045809">
        <ele>7.0</ele>
        <name>WP0262</name>
      </trkpt>
      <trkpt lat="53.481438" lon="-3.045058">
        <ele>7.0</ele>
        <name>WP0263</name>
      </trkpt>
      <trkpt lat="53.481744" lon="-3.044082">
        <ele>9.0</ele>
        <name>WP0264</name>
      </trkpt>
      <trkpt lat="53.480353" lon="-3.042537">
        <ele>7.0</ele>
        <name>WP0265</name>
      </trkpt>
      <trkpt lat="53.479957" lon="-3.041604">
        <ele>7.0</ele>
        <name>WP0266</name>
      </trkpt>
      <trkpt lat="53.477831" lon="-3.038664">
        <ele>9.0</ele>
        <name>WP0267</name>
      </trkpt>
      <trkpt lat="53.477192" lon="-3.037602">
        <ele>6.0</ele>
        <name>WP0268</name>
      </trkpt>
      <trkpt lat="53.477141" lon="-3.037194">
        <ele>7.0</ele>
        <name>WP0269</name>
      </trkpt>
      <trkpt lat="53.477313" lon="-3.036851">
        <ele>7.0</ele>
        <name>WP0270</name>
      </trkpt>
      <trkpt lat="53.476151" lon="-3.034544">
        <ele>11.0</ele>
        <name>WP0271</name>
      </trkpt>
      <trkpt lat="53.473048" lon="-3.030038">
        <ele>7.0</ele>
        <name>WP0272</name>
      </trkpt>
      <trkpt lat="53.475890" lon="-3.023708">
        <ele>13.0</ele>
        <name>WP0273</name>
      </trkpt>
      <trkpt lat="53.476745" lon="-3.024770">
        <ele>14.0</ele>
        <name>WP0274</name>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  // =========================================================================
  // XML Helpers & 2-Space Formatter
  // =========================================================================

  function getDomParser() {
    if (typeof DOMParser !== 'undefined') {
      return new DOMParser();
    }
    throw new Error('DOMParser is not available in this environment.');
  }

  function localName(node) {
    if (!node) return '';
    if (node.localName) return node.localName;
    if (node.tagName) {
      const idx = node.tagName.indexOf(':');
      return idx >= 0 ? node.tagName.slice(idx + 1) : node.tagName;
    }
    return '';
  }

  function getDirectChildren(parent, tagLocalName) {
    const out = [];
    if (!parent || !parent.childNodes) return out;
    for (let i = 0; i < parent.childNodes.length; i += 1) {
      const child = parent.childNodes[i];
      if (child.nodeType === 1) {
        if (!tagLocalName || localName(child) === tagLocalName) {
          out.push(child);
        }
      }
    }
    return out;
  }

  function getFirstDirectChild(parent, tagLocalName) {
    if (!parent || !parent.childNodes) return null;
    for (let i = 0; i < parent.childNodes.length; i += 1) {
      const child = parent.childNodes[i];
      if (child.nodeType === 1 && localName(child) === tagLocalName) {
        return child;
      }
    }
    return null;
  }

  function getElementsByLocalName(root, tagLocalName) {
    const out = [];
    if (!root) return out;
    const all = root.getElementsByTagName('*');
    for (let i = 0; i < all.length; i += 1) {
      if (localName(all[i]) === tagLocalName) {
        out.push(all[i]);
      }
    }
    return out;
  }

  function parseXml(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('The XML text box is empty.');
    }
    const parser = getDomParser();
    const doc = parser.parseFromString(trimmed, 'application/xml');
    const root = doc.documentElement;
    const parserError =
      (root && localName(root) === 'parsererror' ? root : null) ||
      doc.getElementsByTagName('parsererror')[0];

    if (parserError) {
      const msg = (parserError.textContent || 'Invalid XML syntax.')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
      throw new Error('XML Parse Error: ' + msg);
    }
    if (!root) {
      throw new Error('Invalid XML: missing root element.');
    }
    return doc;
  }

  function createEmptyGpxDoc() {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="GPX Utility" xmlns="' +
      GPX_11_NS +
      '"/>';
    return parseXml(xml);
  }

  function createGpxElement(doc, tagName) {
    const rootNs = doc.documentElement ? doc.documentElement.namespaceURI : null;
    if (rootNs) {
      return doc.createElementNS(rootNs, tagName);
    }
    return doc.createElement(tagName);
  }

  function escapeXmlText(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeXmlAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatXmlNode(node, level) {
    const pad = '  '.repeat(level);
    if (node.nodeType === 8) {
      return pad + '<!--' + node.nodeValue + '-->';
    }
    if (node.nodeType === 4) {
      return pad + '<![CDATA[' + node.nodeValue + ']]>';
    }
    if (node.nodeType !== 1) {
      return '';
    }

    const tagName = node.tagName;
    let attrStr = '';
    if (node.attributes && node.attributes.length > 0) {
      for (let i = 0; i < node.attributes.length; i += 1) {
        const attr = node.attributes[i];
        attrStr += ' ' + attr.name + '="' + escapeXmlAttr(attr.value) + '"';
      }
    }

    const significantChildren = [];
    let hasElementOrComment = false;
    let hasCdata = false;

    for (let i = 0; i < node.childNodes.length; i += 1) {
      const child = node.childNodes[i];
      if (child.nodeType === 3) {
        if (child.nodeValue && child.nodeValue.trim().length > 0) {
          significantChildren.push(child);
        }
      } else if (child.nodeType === 4) {
        hasCdata = true;
        significantChildren.push(child);
      } else if (child.nodeType === 1 || child.nodeType === 8) {
        hasElementOrComment = true;
        significantChildren.push(child);
      }
    }

    if (significantChildren.length === 0) {
      return pad + '<' + tagName + attrStr + '/>';
    }

    if (!hasElementOrComment) {
      if (hasCdata && significantChildren.length === 1) {
        return (
          pad +
          '<' +
          tagName +
          attrStr +
          '><![CDATA[' +
          significantChildren[0].nodeValue +
          ']]></' +
          tagName +
          '>'
        );
      }
      const combinedText = significantChildren
        .map(function (c) {
          return c.nodeType === 4 ? '<![CDATA[' + c.nodeValue + ']]>' : escapeXmlText(c.nodeValue);
        })
        .join('')
        .trim();
      if (!combinedText) {
        return pad + '<' + tagName + attrStr + '/>';
      }
      return pad + '<' + tagName + attrStr + '>' + combinedText + '</' + tagName + '>';
    }

    const lines = [pad + '<' + tagName + attrStr + '>'];
    for (let i = 0; i < significantChildren.length; i += 1) {
      const child = significantChildren[i];
      if (child.nodeType === 3) {
        lines.push('  '.repeat(level + 1) + escapeXmlText(child.nodeValue.trim()));
      } else {
        const rendered = formatXmlNode(child, level + 1);
        if (rendered) {
          lines.push(rendered);
        }
      }
    }
    lines.push(pad + '</' + tagName + '>');
    return lines.join('\n');
  }

  function formatXml(docOrString) {
    const doc = typeof docOrString === 'string' ? parseXml(docOrString) : docOrString;
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + formatXmlNode(doc.documentElement, 0) + '\n';
  }

  function insertChildInGpxOrder(parent, newEl, orderList) {
    const newName = localName(newEl);
    const newIdx = orderList.indexOf(newName);
    if (newIdx < 0) {
      parent.appendChild(newEl);
      return;
    }
    const children = getDirectChildren(parent);
    for (let i = 0; i < children.length; i += 1) {
      const existingIdx = orderList.indexOf(localName(children[i]));
      if (existingIdx > newIdx) {
        parent.insertBefore(newEl, children[i]);
        return;
      }
    }
    parent.appendChild(newEl);
  }

  // =========================================================================
  // Geometry, Distance, Douglas-Peucker & Stats
  // =========================================================================

  function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Simplifies an array of { lat, lon, el } points using iterative Douglas-Peucker
   * projected onto a local tangent plane in meters.
   */
  function simplifyPointsDP(points, toleranceMeters) {
    const tol = typeof toleranceMeters === 'number' && toleranceMeters > 0 ? toleranceMeters : 10;
    const n = points.length;
    if (n <= 2) return points.slice();

    const lat0 = points[0].lat;
    const lon0 = points[0].lon;
    const rad = Math.PI / 180;
    const R = 6371000;
    const cosLat0 = Math.cos(lat0 * rad);

    const px = new Float64Array(n);
    const py = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      px[i] = (points[i].lon - lon0) * rad * R * cosLat0;
      py[i] = (points[i].lat - lat0) * rad * R;
    }

    const keep = new Uint8Array(n);
    keep[0] = 1;
    keep[n - 1] = 1;

    const stack = [[0, n - 1]];
    while (stack.length > 0) {
      const range = stack.pop();
      const start = range[0];
      const end = range[1];
      if (end - start <= 1) continue;

      const ax = px[start];
      const ay = py[start];
      const bx = px[end];
      const by = py[end];
      const dx = bx - ax;
      const dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      const len = Math.sqrt(lenSq);

      let maxDist = -1;
      let maxIdx = -1;

      for (let i = start + 1; i < end; i += 1) {
        let dist;
        if (lenSq === 0) {
          dist = Math.hypot(px[i] - ax, py[i] - ay);
        } else {
          dist = Math.abs(dy * (px[i] - ax) - dx * (py[i] - ay)) / len;
        }
        if (dist > maxDist) {
          maxDist = dist;
          maxIdx = i;
        }
      }

      if (maxDist > tol && maxIdx > start && maxIdx < end) {
        keep[maxIdx] = 1;
        stack.push([start, maxIdx], [maxIdx, end]);
      }
    }

    const result = [];
    for (let i = 0; i < n; i += 1) {
      if (keep[i]) {
        result.push(points[i]);
      }
    }
    return result;
  }

  function getPointCoords(ptEl) {
    const lat = parseFloat(ptEl.getAttribute('lat'));
    const lon = parseFloat(ptEl.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const eleEl = getFirstDirectChild(ptEl, 'ele');
    const ele = eleEl ? parseFloat(eleEl.textContent) : NaN;
    return { lat, lon, ele: Number.isFinite(ele) ? ele : null };
  }

  function computeStats(text) {
    const lineCount = text ? text.split(/\r?\n/).length : 0;
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return {
        valid: true,
        empty: true,
        format: 'Empty',
        tracks: 0,
        segments: 0,
        routes: 0,
        trkpts: 0,
        rtepts: 0,
        wpts: 0,
        distanceMeters: 0,
        elevationGain: null,
        wpRange: '',
        lineCount: 0
      };
    }

    let doc;
    try {
      doc = parseXml(trimmed);
    } catch (err) {
      return {
        valid: false,
        empty: false,
        format: 'Invalid XML',
        error: err.message,
        lineCount
      };
    }

    const root = doc.documentElement;
    const rootName = localName(root);
    let format = 'XML (<' + rootName + '>)';
    if (rootName === 'gpx') {
      const ver = root.getAttribute('version') || '1.1';
      format = 'GPX ' + ver;
    } else if (rootName === 'kml') {
      format = 'KML';
    }

    const trks = getElementsByLocalName(root, 'trk');
    const trksegs = getElementsByLocalName(root, 'trkseg');
    const trkpts = getElementsByLocalName(root, 'trkpt');
    const rtes = getElementsByLocalName(root, 'rte');
    const rtepts = getElementsByLocalName(root, 'rtept');
    const wpts = getElementsByLocalName(root, 'wpt');

    let distanceMeters = 0;
    let eleGain = 0;
    let hasEle = false;

    function accumulateSeries(ptElements) {
      let prev = null;
      for (let i = 0; i < ptElements.length; i += 1) {
        const c = getPointCoords(ptElements[i]);
        if (!c) continue;
        if (c.ele !== null) {
          hasEle = true;
        }
        if (prev) {
          distanceMeters += haversineMeters(prev.lat, prev.lon, c.lat, c.lon);
          if (prev.ele !== null && c.ele !== null && c.ele > prev.ele) {
            eleGain += c.ele - prev.ele;
          }
        }
        prev = c;
      }
    }

    if (trksegs.length > 0) {
      for (let i = 0; i < trksegs.length; i += 1) {
        accumulateSeries(getDirectChildren(trksegs[i], 'trkpt'));
      }
    }
    if (rtes.length > 0) {
      for (let i = 0; i < rtes.length; i += 1) {
        accumulateSeries(getDirectChildren(rtes[i], 'rtept'));
      }
    }

    const activePts = trkpts.length > 0 ? trkpts : rtepts;
    let firstWp = '';
    let lastWp = '';
    if (activePts.length > 0) {
      const firstNameEl = getFirstDirectChild(activePts[0], 'name');
      const lastNameEl = getFirstDirectChild(activePts[activePts.length - 1], 'name');
      const fn = firstNameEl ? firstNameEl.textContent.trim() : '';
      const ln = lastNameEl ? lastNameEl.textContent.trim() : '';
      if (/^WP\d+$/i.test(fn) && /^WP\d+$/i.test(ln)) {
        firstWp = fn;
        lastWp = ln;
      }
    }

    return {
      valid: true,
      empty: false,
      format,
      tracks: trks.length,
      segments: trksegs.length,
      routes: rtes.length,
      trkpts: trkpts.length,
      rtepts: rtepts.length,
      wpts: wpts.length,
      distanceMeters,
      elevationGain: hasEle ? Math.round(eleGain) : null,
      wpRange: firstWp && lastWp ? firstWp + '–' + lastWp : '',
      lineCount
    };
  }

  // =========================================================================
  // GPX Operations
  // =========================================================================

  function ensureGpxRoot(doc) {
    const rootName = localName(doc.documentElement);
    if (rootName === 'kml') {
      throw new Error('This is a KML file. Click "Convert KML → GPX" first.');
    }
    if (rootName !== 'gpx') {
      throw new Error('Expected a <gpx> root element, found <' + rootName + '>.');
    }
  }

  function cleanupUnusedNamespaces(doc) {
    const root = doc.documentElement;
    const usedPrefixes = new Set();

    const allEls = root.getElementsByTagName('*');
    const elementsToScan = [root];
    for (let i = 0; i < allEls.length; i += 1) {
      elementsToScan.push(allEls[i]);
    }

    for (let i = 0; i < elementsToScan.length; i += 1) {
      const el = elementsToScan[i];
      if (el.tagName && el.tagName.includes(':')) {
        usedPrefixes.add(el.tagName.split(':')[0]);
      }
      for (let j = 0; j < el.attributes.length; j += 1) {
        const attrName = el.attributes[j].name;
        if (attrName.includes(':') && !attrName.startsWith('xmlns:')) {
          usedPrefixes.add(attrName.split(':')[0]);
        }
      }
    }

    let removedAttrs = 0;
    const remainingNsUris = new Set();

    for (let i = 0; i < elementsToScan.length; i += 1) {
      const el = elementsToScan[i];
      const toRemove = [];
      for (let j = 0; j < el.attributes.length; j += 1) {
        const attr = el.attributes[j];
        if (attr.name.startsWith('xmlns:')) {
          const prefix = attr.name.slice(6);
          if (!usedPrefixes.has(prefix)) {
            toRemove.push(attr.name);
          } else {
            remainingNsUris.add(attr.value);
          }
        } else if (attr.name === 'xmlns') {
          remainingNsUris.add(attr.value);
        }
      }
      for (let j = 0; j < toRemove.length; j += 1) {
        el.removeAttribute(toRemove[j]);
        removedAttrs += 1;
      }
    }

    // Prune xsi:schemaLocation entries whose namespace URIs were removed
    for (let i = 0; i < elementsToScan.length; i += 1) {
      const el = elementsToScan[i];
      if (el.hasAttribute('xsi:schemaLocation')) {
        const tokens = el.getAttribute('xsi:schemaLocation').trim().split(/\s+/);
        const kept = [];
        for (let k = 0; k + 1 < tokens.length; k += 2) {
          const nsUri = tokens[k];
          const xsdUrl = tokens[k + 1];
          if (remainingNsUris.has(nsUri)) {
            kept.push(nsUri, xsdUrl);
          }
        }
        if (kept.length === 0) {
          el.removeAttribute('xsi:schemaLocation');
          removedAttrs += 1;
        } else if (kept.length !== tokens.length) {
          el.setAttribute('xsi:schemaLocation', kept.join(' '));
        }
      }
    }

    // Remove xmlns:xsi if xsi prefix is no longer used anywhere
    const xsiStillUsed = elementsToScan.some(function (el) {
      for (let j = 0; j < el.attributes.length; j += 1) {
        if (el.attributes[j].name.startsWith('xsi:')) return true;
      }
      return false;
    });
    if (!xsiStillUsed && root.hasAttribute('xmlns:xsi')) {
      root.removeAttribute('xmlns:xsi');
      removedAttrs += 1;
    }

    return removedAttrs;
  }

  function removeUnwantedTags(doc, options) {
    ensureGpxRoot(doc);
    const opts = options || {};
    const root = doc.documentElement;
    const allEls = root.getElementsByTagName('*');
    const toRemove = [];

    for (let i = 0; i < allEls.length; i += 1) {
      const el = allEls[i];
      const name = localName(el);
      const ns = el.namespaceURI || '';
      const isThirdPartyNs =
        (ns !== '' && ns !== GPX_11_NS && ns !== GPX_10_NS) ||
        (el.tagName.includes(':') && ns !== GPX_11_NS && ns !== GPX_10_NS);

      if (opts.removeExtensions && (name === 'extensions' || isThirdPartyNs)) {
        toRemove.push(el);
      } else if (opts.removeTime && name === 'time') {
        toRemove.push(el);
      } else if (opts.removeNonEssential && NON_ESSENTIAL_TAGS.has(name)) {
        toRemove.push(el);
      } else if (opts.removeMetadata && name === 'metadata') {
        toRemove.push(el);
      } else if (opts.removeEle && name === 'ele') {
        toRemove.push(el);
      } else if (
        opts.removePtName &&
        name === 'name' &&
        el.parentNode &&
        (localName(el.parentNode) === 'trkpt' || localName(el.parentNode) === 'rtept')
      ) {
        toRemove.push(el);
      }
    }

    const removeSet = new Set(toRemove);
    let removedElements = 0;
    for (let i = 0; i < toRemove.length; i += 1) {
      const el = toRemove[i];
      let ancestorRemoved = false;
      let p = el.parentNode;
      while (p && p !== root) {
        if (removeSet.has(p)) {
          ancestorRemoved = true;
          break;
        }
        p = p.parentNode;
      }
      if (!ancestorRemoved && el.parentNode) {
        el.parentNode.removeChild(el);
        removedElements += 1;
      }
    }

    let removedNsAttrs = 0;
    if (opts.removeExtensions) {
      removedNsAttrs = cleanupUnusedNamespaces(doc);
    }

    return {
      xml: formatXml(doc),
      removedElements,
      removedNsAttrs
    };
  }

  function joinTrackSegments(doc) {
    ensureGpxRoot(doc);
    const trks = getElementsByLocalName(doc.documentElement, 'trk');
    if (trks.length === 0) {
      throw new Error('No <trk> elements found in this GPX.');
    }

    let mergedSegments = 0;
    for (let i = 0; i < trks.length; i += 1) {
      const segs = getDirectChildren(trks[i], 'trkseg');
      if (segs.length <= 1) continue;
      const targetSeg = segs[0];
      for (let s = 1; s < segs.length; s += 1) {
        const pts = getDirectChildren(segs[s], 'trkpt');
        for (let p = 0; p < pts.length; p += 1) {
          targetSeg.appendChild(pts[p]);
        }
        trks[i].removeChild(segs[s]);
        mergedSegments += 1;
      }
    }

    return {
      xml: formatXml(doc),
      mergedSegments
    };
  }

  function simplifyTracksAndRoutes(doc, toleranceMeters) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const trks = getElementsByLocalName(root, 'trk');
    const rtes = getElementsByLocalName(root, 'rte');
    if (trks.length === 0 && rtes.length === 0) {
      throw new Error('No <trk> or <rte> elements found to simplify.');
    }

    const tol = typeof toleranceMeters === 'number' && toleranceMeters > 0 ? toleranceMeters : 10;
    let totalBefore = 0;
    let totalAfter = 0;

    function simplifyPointSequence(ptElements) {
      const pts = [];
      for (let i = 0; i < ptElements.length; i += 1) {
        const ptEl = ptElements[i];
        const lat = parseFloat(ptEl.getAttribute('lat'));
        const lon = parseFloat(ptEl.getAttribute('lon'));
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          pts.push({ lat, lon, el: ptEl });
        }
      }
      totalBefore += pts.length;
      if (pts.length <= 2) {
        totalAfter += pts.length;
        return;
      }
      const kept = simplifyPointsDP(pts, tol);
      const keptSet = new Set(
        kept.map(function (item) {
          return item.el;
        })
      );
      totalAfter += kept.length;
      for (let i = 0; i < pts.length; i += 1) {
        if (!keptSet.has(pts[i].el) && pts[i].el.parentNode) {
          pts[i].el.parentNode.removeChild(pts[i].el);
        }
      }
    }

    for (let i = 0; i < trks.length; i += 1) {
      const segs = getDirectChildren(trks[i], 'trkseg');
      for (let s = 0; s < segs.length; s += 1) {
        simplifyPointSequence(getDirectChildren(segs[s], 'trkpt'));
      }
    }
    for (let i = 0; i < rtes.length; i += 1) {
      simplifyPointSequence(getDirectChildren(rtes[i], 'rtept'));
    }

    if (totalBefore === 0) {
      throw new Error('No <trkpt> or <rtept> points found to simplify.');
    }

    return {
      xml: formatXml(doc),
      totalBefore,
      totalAfter,
      removedCount: totalBefore - totalAfter
    };
  }

  function convertTracksToRoutes(doc) {
    ensureGpxRoot(doc);
    const trks = getElementsByLocalName(doc.documentElement, 'trk');
    if (trks.length === 0) {
      throw new Error('No <trk> elements found to convert to routes.');
    }

    let totalBefore = 0;
    let totalAfter = 0;

    for (let i = 0; i < trks.length; i += 1) {
      const trk = trks[i];
      const rte = createGpxElement(doc, 'rte');

      // Copy metadata children of <trk> (except <trkseg>)
      const children = getDirectChildren(trk);
      const collectedPts = [];
      for (let c = 0; c < children.length; c += 1) {
        const child = children[c];
        if (localName(child) === 'trkseg') {
          const segPts = getDirectChildren(child, 'trkpt');
          for (let p = 0; p < segPts.length; p += 1) {
            const ptEl = segPts[p];
            const lat = parseFloat(ptEl.getAttribute('lat'));
            const lon = parseFloat(ptEl.getAttribute('lon'));
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              collectedPts.push({ lat, lon, el: ptEl });
            }
          }
        } else {
          rte.appendChild(child.cloneNode(true));
        }
      }

      totalBefore += collectedPts.length;
      totalAfter += collectedPts.length;

      for (let p = 0; p < collectedPts.length; p += 1) {
        const srcPt = collectedPts[p].el;
        const rtept = createGpxElement(doc, 'rtept');
        for (let a = 0; a < srcPt.attributes.length; a += 1) {
          const attr = srcPt.attributes[a];
          rtept.setAttribute(attr.name, attr.value);
        }
        const ptChildren = getDirectChildren(srcPt);
        for (let pc = 0; pc < ptChildren.length; pc += 1) {
          rtept.appendChild(ptChildren[pc].cloneNode(true));
        }
        rte.appendChild(rtept);
      }

      trk.parentNode.replaceChild(rte, trk);
    }

    return {
      xml: formatXml(doc),
      convertedCount: trks.length,
      totalBefore,
      totalAfter
    };
  }

  function convertRoutesToTracks(doc) {
    ensureGpxRoot(doc);
    const rtes = getElementsByLocalName(doc.documentElement, 'rte');
    if (rtes.length === 0) {
      throw new Error('No <rte> elements found to convert to tracks.');
    }

    let totalPoints = 0;
    for (let i = 0; i < rtes.length; i += 1) {
      const rte = rtes[i];
      const trk = createGpxElement(doc, 'trk');
      const trkseg = createGpxElement(doc, 'trkseg');

      const children = getDirectChildren(rte);
      for (let c = 0; c < children.length; c += 1) {
        const child = children[c];
        if (localName(child) === 'rtept') {
          const trkpt = createGpxElement(doc, 'trkpt');
          for (let a = 0; a < child.attributes.length; a += 1) {
            const attr = child.attributes[a];
            trkpt.setAttribute(attr.name, attr.value);
          }
          const ptChildren = getDirectChildren(child);
          for (let pc = 0; pc < ptChildren.length; pc += 1) {
            trkpt.appendChild(ptChildren[pc].cloneNode(true));
          }
          trkseg.appendChild(trkpt);
          totalPoints += 1;
        } else {
          trk.appendChild(child.cloneNode(true));
        }
      }

      trk.appendChild(trkseg);
      rte.parentNode.replaceChild(trk, rte);
    }

    return {
      xml: formatXml(doc),
      convertedCount: rtes.length,
      totalPoints
    };
  }

  function formatWpName(num) {
    return 'WP' + String(num).padStart(4, '0');
  }

  function numberTrackAndRoutePoints(doc) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const trks = getElementsByLocalName(root, 'trk');
    const rtes = getElementsByLocalName(root, 'rte');
    if (trks.length === 0 && rtes.length === 0) {
      throw new Error('No <trk> or <rte> elements found to name points.');
    }

    let totalNamed = 0;

    function processPointList(pts) {
      for (let i = 0; i < pts.length; i += 1) {
        const pt = pts[i];
        const existingNames = getDirectChildren(pt, 'name');
        for (let n = 0; n < existingNames.length; n += 1) {
          pt.removeChild(existingNames[n]);
        }
        const nameEl = createGpxElement(doc, 'name');
        nameEl.textContent = formatWpName(i + 1);
        insertChildInGpxOrder(pt, nameEl, GPX_POINT_CHILD_ORDER);
        totalNamed += 1;
      }
    }

    for (let i = 0; i < trks.length; i += 1) {
      processPointList(getElementsByLocalName(trks[i], 'trkpt'));
    }
    for (let i = 0; i < rtes.length; i += 1) {
      processPointList(getDirectChildren(rtes[i], 'rtept'));
    }

    if (totalNamed === 0) {
      throw new Error('No <trkpt> or <rtept> points found.');
    }

    return {
      xml: formatXml(doc),
      totalNamed
    };
  }

  function reverseTracksAndRoutes(doc) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const trks = getElementsByLocalName(root, 'trk');
    const rtes = getElementsByLocalName(root, 'rte');
    if (trks.length === 0 && rtes.length === 0) {
      throw new Error('No <trk> or <rte> elements found to reverse.');
    }

    let reversedPoints = 0;

    for (let i = 0; i < trks.length; i += 1) {
      const trk = trks[i];
      const segs = getDirectChildren(trk, 'trkseg');
      if (segs.length === 0) continue;

      const allPts = [];
      for (let s = 0; s < segs.length; s += 1) {
        const pts = getDirectChildren(segs[s], 'trkpt');
        for (let p = 0; p < pts.length; p += 1) {
          segs[s].removeChild(pts[p]);
          allPts.push(pts[p]);
        }
      }
      for (let s = 1; s < segs.length; s += 1) {
        trk.removeChild(segs[s]);
      }
      const targetSeg = segs[0];
      for (let p = allPts.length - 1; p >= 0; p -= 1) {
        targetSeg.appendChild(allPts[p]);
        reversedPoints += 1;
      }
    }

    // If multiple <trk> elements are direct children of <gpx>, reverse their order too
    const directTrks = getDirectChildren(root, 'trk');
    if (directTrks.length > 1) {
      const anchor = directTrks[directTrks.length - 1].nextSibling;
      for (let i = 0; i < directTrks.length; i += 1) {
        root.removeChild(directTrks[i]);
      }
      for (let i = directTrks.length - 1; i >= 0; i -= 1) {
        root.insertBefore(directTrks[i], anchor);
      }
    }

    for (let i = 0; i < rtes.length; i += 1) {
      const rte = rtes[i];
      const pts = getDirectChildren(rte, 'rtept');
      for (let p = 0; p < pts.length; p += 1) {
        rte.removeChild(pts[p]);
      }
      for (let p = pts.length - 1; p >= 0; p -= 1) {
        rte.appendChild(pts[p]);
        reversedPoints += 1;
      }
    }

    if (reversedPoints === 0) {
      throw new Error('No points found inside tracks or routes.');
    }

    return {
      xml: formatXml(doc),
      reversedPoints
    };
  }

  function parsePointNumberToken(token) {
    const cleaned = String(token || '').trim().replace(/^WP/i, '');
    if (!/^\d+$/.test(cleaned)) {
      throw new Error('Invalid point number "' + token + '". Use numbers like 5 or WP0005.');
    }
    const num = parseInt(cleaned, 10);
    if (num < 1) {
      throw new Error('Point numbers must be 1 or greater.');
    }
    return num;
  }

  function parseRangeSpec(spec) {
    const raw = (spec || '').trim();
    if (!raw) {
      throw new Error('Enter a point range to remove (e.g. 5-10).');
    }
    const parts = raw.split(',');
    const ranges = [];
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i].trim();
      if (!part) continue;
      if (part.includes('-')) {
        const bounds = part.split('-');
        if (bounds.length !== 2) {
          throw new Error('Invalid range "' + part + '". Use start-end like 5-10.');
        }
        const start = parsePointNumberToken(bounds[0]);
        const end = parsePointNumberToken(bounds[1]);
        if (start > end) {
          throw new Error('Invalid range "' + part + '": start (' + start + ') must be <= end (' + end + ').');
        }
        ranges.push([start, end]);
      } else {
        const single = parsePointNumberToken(part);
        ranges.push([single, single]);
      }
    }
    if (ranges.length === 0) {
      throw new Error('Enter a point range to remove (e.g. 5-10).');
    }
    return ranges;
  }

  function getPointNumber(ptEl, index1Based, matchMode) {
    if (matchMode !== 'position') {
      const nameEl = getFirstDirectChild(ptEl, 'name');
      if (nameEl) {
        const m = nameEl.textContent.trim().match(/^WP(\d+)$/i);
        if (m) {
          return parseInt(m[1], 10);
        }
      }
    }
    return index1Based;
  }

  function getPointContainers(doc) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const containers = [];
    const trks = getElementsByLocalName(root, 'trk');
    for (let i = 0; i < trks.length; i += 1) {
      containers.push(getElementsByLocalName(trks[i], 'trkpt'));
    }
    const rtes = getElementsByLocalName(root, 'rte');
    for (let i = 0; i < rtes.length; i += 1) {
      containers.push(getDirectChildren(rtes[i], 'rtept'));
    }
    return containers;
  }

  function removePointsByRange(doc, rangeSpec, matchMode) {
    const ranges = parseRangeSpec(rangeSpec);
    const containers = getPointContainers(doc);
    if (containers.length === 0) {
      throw new Error('No <trk> or <rte> elements found.');
    }

    let removed = 0;
    let remaining = 0;

    for (let c = 0; c < containers.length; c += 1) {
      const pts = containers[c];
      for (let i = 0; i < pts.length; i += 1) {
        const num = getPointNumber(pts[i], i + 1, matchMode);
        const shouldRemove = ranges.some(function (r) {
          return num >= r[0] && num <= r[1];
        });
        if (shouldRemove) {
          if (pts[i].parentNode) {
            pts[i].parentNode.removeChild(pts[i]);
          }
          removed += 1;
        } else {
          remaining += 1;
        }
      }
    }

    return {
      xml: formatXml(doc),
      removed,
      remaining
    };
  }

  function trimPointsByStartEnd(doc, startSpec, endSpec, matchMode) {
    const startRaw = (startSpec || '').trim();
    const endRaw = (endSpec || '').trim();
    if (!startRaw && !endRaw) {
      throw new Error('Enter a Start point, an End point, or both.');
    }

    const startNum = startRaw ? parsePointNumberToken(startRaw) : null;
    const endNum = endRaw ? parsePointNumberToken(endRaw) : null;

    if (startNum !== null && endNum !== null && startNum > endNum) {
      throw new Error('Start point (' + startNum + ') cannot be greater than End point (' + endNum + ').');
    }

    const containers = getPointContainers(doc);
    if (containers.length === 0) {
      throw new Error('No <trk> or <rte> elements found.');
    }

    let removed = 0;
    let remaining = 0;

    for (let c = 0; c < containers.length; c += 1) {
      const pts = containers[c];
      for (let i = 0; i < pts.length; i += 1) {
        const num = getPointNumber(pts[i], i + 1, matchMode);
        const beforeStart = startNum !== null && num < startNum;
        const afterEnd = endNum !== null && num > endNum;
        if (beforeStart || afterEnd) {
          if (pts[i].parentNode) {
            pts[i].parentNode.removeChild(pts[i]);
          }
          removed += 1;
        } else {
          remaining += 1;
        }
      }
    }

    return {
      xml: formatXml(doc),
      removed,
      remaining
    };
  }

  // =========================================================================
  // KML -> GPX Converter
  // =========================================================================

  function parseKmlCoordinates(coordText) {
    const pts = [];
    const tokens = (coordText || '').trim().split(/\s+/);
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i].trim();
      if (!token) continue;
      const parts = token.split(',');
      if (parts.length < 2) continue;
      const lon = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      const ele = parts.length >= 3 && parts[2] !== '' ? parseFloat(parts[2]) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        pts.push({
          lat: lat,
          lon: lon,
          ele: Number.isFinite(ele) ? ele : null
        });
      }
    }
    return pts;
  }

  function cleanKmlDescription(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    // Strip basic HTML tags if KML wraps description in HTML
    return trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function buildGpxFromData(data) {
    const doc = createEmptyGpxDoc();
    const gpxRoot = doc.documentElement;

    const wpts = data.waypoints || [];
    for (let i = 0; i < wpts.length; i += 1) {
      const w = wpts[i];
      const wptEl = createGpxElement(doc, 'wpt');
      wptEl.setAttribute('lat', formatCoord(w.lat));
      wptEl.setAttribute('lon', formatCoord(w.lon));
      if (w.ele !== null && w.ele !== undefined && Number.isFinite(w.ele)) {
        const eleEl = createGpxElement(doc, 'ele');
        eleEl.textContent = formatEle(w.ele);
        wptEl.appendChild(eleEl);
      }
      if (w.name) {
        const nameEl = createGpxElement(doc, 'name');
        nameEl.textContent = w.name;
        wptEl.appendChild(nameEl);
      }
      if (w.desc) {
        const descEl = createGpxElement(doc, 'desc');
        descEl.textContent = w.desc;
        wptEl.appendChild(descEl);
      }
      if (w.type) {
        const typeEl = createGpxElement(doc, 'type');
        typeEl.textContent = w.type;
        wptEl.appendChild(typeEl);
      }
      gpxRoot.appendChild(wptEl);
    }

    const trks = data.tracks || [];
    for (let t = 0; t < trks.length; t += 1) {
      const trkData = trks[t];
      const trkEl = createGpxElement(doc, 'trk');
      if (trkData.name) {
        const nameEl = createGpxElement(doc, 'name');
        nameEl.textContent = trkData.name;
        trkEl.appendChild(nameEl);
      }
      if (trkData.desc) {
        const descEl = createGpxElement(doc, 'desc');
        descEl.textContent = trkData.desc;
        trkEl.appendChild(descEl);
      }
      const segments = trkData.segments || [];
      for (let s = 0; s < segments.length; s += 1) {
        const segPts = segments[s];
        if (!segPts || segPts.length === 0) continue;
        const segEl = createGpxElement(doc, 'trkseg');
        for (let p = 0; p < segPts.length; p += 1) {
          const pt = segPts[p];
          const trkptEl = createGpxElement(doc, 'trkpt');
          trkptEl.setAttribute('lat', formatCoord(pt.lat));
          trkptEl.setAttribute('lon', formatCoord(pt.lon));
          if (pt.ele !== null && pt.ele !== undefined && Number.isFinite(pt.ele)) {
            const eleEl = createGpxElement(doc, 'ele');
            eleEl.textContent = formatEle(pt.ele);
            trkptEl.appendChild(eleEl);
          }
          segEl.appendChild(trkptEl);
        }
        trkEl.appendChild(segEl);
      }
      if (getDirectChildren(trkEl, 'trkseg').length > 0) {
        gpxRoot.appendChild(trkEl);
      }
    }

    return formatXml(doc);
  }

  function formatCoord(num) {
    return Number(num).toFixed(7).replace(/\.?0+$/, '');
  }

  function formatEle(num) {
    return Number(num).toFixed(1).replace(/\.0$/, '');
  }

  function convertKmlToGpx(doc) {
    const rootName = localName(doc.documentElement);
    if (rootName === 'gpx') {
      throw new Error('The editor already contains GPX XML.');
    }
    if (rootName !== 'kml') {
      throw new Error('Expected a <kml> root element, found <' + rootName + '>.');
    }

    const root = doc.documentElement;
    const docEl = getFirstDirectChild(root, 'Document') || getFirstDirectChild(root, 'Folder') || root;
    const docNameEl = getFirstDirectChild(docEl, 'name');
    const docDescEl = getFirstDirectChild(docEl, 'description');
    const fallbackName = docNameEl ? docNameEl.textContent.trim() : '';
    const fallbackDesc = docDescEl ? cleanKmlDescription(docDescEl.textContent) : '';

    const placemarks = getElementsByLocalName(root, 'Placemark');
    const waypoints = [];
    const tracks = [];

    for (let i = 0; i < placemarks.length; i += 1) {
      const pm = placemarks[i];
      const nameEl = getFirstDirectChild(pm, 'name');
      const descEl = getFirstDirectChild(pm, 'description');
      const pmName = nameEl ? nameEl.textContent.trim() : '';
      const pmDesc = descEl ? cleanKmlDescription(descEl.textContent) : '';

      const points = getElementsByLocalName(pm, 'Point');
      for (let p = 0; p < points.length; p += 1) {
        const coordsEl = getFirstDirectChild(points[p], 'coordinates');
        if (!coordsEl) continue;
        const parsed = parseKmlCoordinates(coordsEl.textContent);
        if (parsed.length > 0) {
          waypoints.push({
            lat: parsed[0].lat,
            lon: parsed[0].lon,
            ele: parsed[0].ele,
            name: pmName || 'Waypoint',
            desc: pmDesc
          });
        }
      }

      const segments = [];
      const lineStrings = getElementsByLocalName(pm, 'LineString');
      for (let l = 0; l < lineStrings.length; l += 1) {
        const coordsEl = getFirstDirectChild(lineStrings[l], 'coordinates');
        if (!coordsEl) continue;
        const parsed = parseKmlCoordinates(coordsEl.textContent);
        if (parsed.length > 0) {
          segments.push(parsed);
        }
      }

      // Support <gx:Track> elements
      const gxTracks = getElementsByLocalName(pm, 'Track');
      for (let gt = 0; gt < gxTracks.length; gt += 1) {
        const coords = getDirectChildren(gxTracks[gt], 'coord');
        const gxPts = [];
        for (let c = 0; c < coords.length; c += 1) {
          const parts = coords[c].textContent.trim().split(/\s+/);
          if (parts.length < 2) continue;
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const ele = parts.length >= 3 ? parseFloat(parts[2]) : NaN;
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            gxPts.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null });
          }
        }
        if (gxPts.length > 0) {
          segments.push(gxPts);
        }
      }

      if (segments.length > 0) {
        tracks.push({
          name: pmName || fallbackName || 'KML Track',
          desc: pmDesc || fallbackDesc,
          segments
        });
      }
    }

    if (waypoints.length === 0 && tracks.length === 0) {
      throw new Error('No <Point>, <LineString>, or <gx:Track> geometries found in KML.');
    }

    const xml = buildGpxFromData({ waypoints, tracks });
    return {
      xml,
      waypointCount: waypoints.length,
      trackCount: tracks.length
    };
  }

  // =========================================================================
  // Binary Garmin FIT -> GPX Converter (Zero Third-Party Libraries)
  // =========================================================================

  function decodeFitString(bytes, offset, size) {
    let end = offset;
    const limit = offset + size;
    while (end < limit && bytes[end] !== 0) {
      end += 1;
    }
    if (end === offset) return '';
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes.subarray(offset, end)).trim();
    }
    let out = '';
    for (let i = offset; i < end; i += 1) {
      out += String.fromCharCode(bytes[i]);
    }
    return out.trim();
  }

  function readFitFieldValue(view, bytes, offset, size, baseType, littleEndian) {
    const typeId = baseType & 0x1f;
    switch (typeId) {
      case 0: // enum
      case 2: { // uint8
        if (size < 1) return null;
        const val = bytes[offset];
        return val === 0xff ? null : val;
      }
      case 1: { // sint8
        if (size < 1) return null;
        const val = view.getInt8(offset);
        return val === 0x7f ? null : val;
      }
      case 3: { // sint16
        if (size < 2) return null;
        const val = view.getInt16(offset, littleEndian);
        return val === 0x7fff ? null : val;
      }
      case 4: { // uint16
        if (size < 2) return null;
        const val = view.getUint16(offset, littleEndian);
        return val === 0xffff ? null : val;
      }
      case 5: { // sint32
        if (size < 4) return null;
        const val = view.getInt32(offset, littleEndian);
        return val === 0x7fffffff ? null : val;
      }
      case 6: { // uint32
        if (size < 4) return null;
        const val = view.getUint32(offset, littleEndian);
        return val === 0xffffffff ? null : val;
      }
      case 7: // string
        return decodeFitString(bytes, offset, size);
      case 8: { // float32
        if (size < 4) return null;
        const val = view.getFloat32(offset, littleEndian);
        return Number.isNaN(val) ? null : val;
      }
      case 9: { // float64
        if (size < 8) return null;
        const val = view.getFloat64(offset, littleEndian);
        return Number.isNaN(val) ? null : val;
      }
      case 10: { // uint8z
        if (size < 1) return null;
        const val = bytes[offset];
        return val === 0 ? null : val;
      }
      case 11: { // uint16z
        if (size < 2) return null;
        const val = view.getUint16(offset, littleEndian);
        return val === 0 ? null : val;
      }
      case 12: { // uint32z
        if (size < 4) return null;
        const val = view.getUint32(offset, littleEndian);
        return val === 0 ? null : val;
      }
      default:
        return null;
    }
  }

  function semicirclesToDegrees(sc) {
    return sc * (180 / 2147483648);
  }

  function parseFitToGpx(arrayBuffer, defaultName) {
    if (!arrayBuffer || arrayBuffer.byteLength < 14) {
      throw new Error('File is too small to be a valid FIT file.');
    }

    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const headerSize = bytes[0];
    if (headerSize < 12 || headerSize > bytes.length) {
      throw new Error('Invalid FIT header size.');
    }

    const sig = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (sig !== '.FIT') {
      throw new Error('Invalid FIT file signature (missing ".FIT" header).');
    }

    const dataSize = view.getUint32(4, true);
    const endOffset = Math.min(bytes.length, headerSize + dataSize);
    let offset = headerSize;

    const definitions = Object.create(null);
    let courseName = '';
    const trackPoints = [];
    const waypoints = [];

    function readDataMessage(def) {
      const vals = Object.create(null);
      for (let i = 0; i < def.fields.length; i += 1) {
        const f = def.fields[i];
        if (offset + f.size > endOffset) {
          throw new Error('Unexpected end of FIT data while reading record.');
        }
        const value = readFitFieldValue(view, bytes, offset, f.size, f.baseType, def.littleEndian);
        if (value !== null) {
          vals[f.fieldDefNum] = value;
        }
        offset += f.size;
      }
      if (def.devDataSize > 0) {
        offset += def.devDataSize;
      }

      if (def.globalMsgNum === 31) {
        // course
        if (typeof vals[5] === 'string' && vals[5]) {
          courseName = vals[5];
        }
      } else if (def.globalMsgNum === 20) {
        // record
        const latSc = vals[0];
        const lonSc = vals[1];
        if (typeof latSc === 'number' && typeof lonSc === 'number') {
          const lat = semicirclesToDegrees(latSc);
          const lon = semicirclesToDegrees(lonSc);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            let ele = null;
            if (typeof vals[78] === 'number') {
              ele = vals[78] / 5 - 500;
            } else if (typeof vals[2] === 'number') {
              ele = vals[2] / 5 - 500;
            }
            trackPoints.push({ lat, lon, ele });
          }
        }
      } else if (def.globalMsgNum === 32) {
        // course_point
        const latSc = vals[2];
        const lonSc = vals[3];
        if (typeof latSc === 'number' && typeof lonSc === 'number') {
          const lat = semicirclesToDegrees(latSc);
          const lon = semicirclesToDegrees(lonSc);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            const typeName = typeof vals[5] === 'number' ? COURSE_POINT_TYPES[vals[5]] || '' : '';
            waypoints.push({
              lat,
              lon,
              ele: null,
              name: typeof vals[6] === 'string' && vals[6] ? vals[6] : typeName || 'Waypoint',
              type: typeName
            });
          }
        }
      } else if (def.globalMsgNum === 29) {
        // location
        const latSc = vals[1];
        const lonSc = vals[2];
        if (typeof latSc === 'number' && typeof lonSc === 'number') {
          const lat = semicirclesToDegrees(latSc);
          const lon = semicirclesToDegrees(lonSc);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            const ele = typeof vals[4] === 'number' ? vals[4] / 5 - 500 : null;
            waypoints.push({
              lat,
              lon,
              ele,
              name: typeof vals[0] === 'string' && vals[0] ? vals[0] : 'Waypoint'
            });
          }
        }
      }
    }

    while (offset < endOffset) {
      const header = bytes[offset];
      offset += 1;

      if ((header & 0x80) !== 0) {
        const localMsgType = (header >> 5) & 0x03;
        const def = definitions[localMsgType];
        if (!def) {
          throw new Error('FIT parse error: missing definition for compressed timestamp local message ' + localMsgType);
        }
        readDataMessage(def);
      } else {
        const isDefinition = (header & 0x40) !== 0;
        const hasDevFields = (header & 0x20) !== 0;
        const localMsgType = header & 0x0f;

        if (isDefinition) {
          if (offset + 5 > endOffset) {
            throw new Error('Unexpected end of FIT data in definition header.');
          }
          offset += 1; // reserved
          const arch = bytes[offset];
          offset += 1;
          const littleEndian = arch === 0;
          const globalMsgNum = view.getUint16(offset, littleEndian);
          offset += 2;
          const numFields = bytes[offset];
          offset += 1;

          if (offset + numFields * 3 > endOffset) {
            throw new Error('Unexpected end of FIT data in field definitions.');
          }
          const fields = [];
          for (let i = 0; i < numFields; i += 1) {
            fields.push({
              fieldDefNum: bytes[offset],
              size: bytes[offset + 1],
              baseType: bytes[offset + 2]
            });
            offset += 3;
          }

          let devDataSize = 0;
          if (hasDevFields) {
            const numDevFields = bytes[offset];
            offset += 1;
            for (let i = 0; i < numDevFields; i += 1) {
              devDataSize += bytes[offset + 1];
              offset += 3;
            }
          }

          definitions[localMsgType] = {
            littleEndian,
            globalMsgNum,
            fields,
            devDataSize
          };
        } else {
          const def = definitions[localMsgType];
          if (!def) {
            throw new Error('FIT parse error: missing definition for local message ' + localMsgType);
          }
          readDataMessage(def);
        }
      }
    }

    if (trackPoints.length === 0 && waypoints.length === 0) {
      throw new Error('No GPS track points or waypoints found in this FIT file.');
    }

    const trackName = courseName || (defaultName ? defaultName.replace(/\.fit$/i, '') : 'FIT Track');
    const tracks = trackPoints.length > 0 ? [{ name: trackName, segments: [trackPoints] }] : [];
    const xml = buildGpxFromData({ waypoints, tracks });

    return {
      xml,
      trackPointCount: trackPoints.length,
      waypointCount: waypoints.length
    };
  }

  // =========================================================================
  // Waypoint Helpers
  // =========================================================================

  function parseCombinedLatLon(text) {
    const raw = (text || '').trim();
    if (!raw) return null;
    const match = raw.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[,\s]\s*([+-]?\d+(?:\.\d+)?)\s*$/);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latStr: match[1], lonStr: match[2], lat, lon };
  }

  function parseSourcePointSnippet(text) {
    const raw = (text || '').trim();
    if (!raw) return null;

    let latStr = '';
    let lonStr = '';
    let eleStr = '';
    let nameStr = '';
    let descStr = '';

    // Try XML parsing first when valid snippet is provided
    try {
      const parser = getDomParser();
      const doc = parser.parseFromString(raw, 'application/xml');
      const root = doc.documentElement;
      if (root && localName(root) !== 'parsererror' && !doc.getElementsByTagName('parsererror').length) {
        const ptEl =
          localName(root) === 'trkpt' || localName(root) === 'rtept' || localName(root) === 'wpt'
            ? root
            : getElementsByLocalName(root, 'trkpt')[0] ||
              getElementsByLocalName(root, 'rtept')[0] ||
              getElementsByLocalName(root, 'wpt')[0];
        if (ptEl) {
          latStr = (ptEl.getAttribute('lat') || '').trim();
          lonStr = (ptEl.getAttribute('lon') || '').trim();
          const eleEl = getFirstDirectChild(ptEl, 'ele');
          const nameEl = getFirstDirectChild(ptEl, 'name');
          const descEl = getFirstDirectChild(ptEl, 'desc');
          if (eleEl) eleStr = eleEl.textContent.trim();
          if (nameEl) nameStr = nameEl.textContent.trim();
          if (descEl) descStr = descEl.textContent.trim();
        }
      }
    } catch (_err) {
      // Fallback to regex extraction below
    }

    if (!latStr || !lonStr) {
      const latMatch = raw.match(/\blat\s*=\s*["']([^"']+)["']/i);
      const lonMatch = raw.match(/\blon\s*=\s*["']([^"']+)["']/i);
      if (latMatch) latStr = latMatch[1].trim();
      if (lonMatch) lonStr = lonMatch[1].trim();
    }
    if (!eleStr) {
      const eleMatch = raw.match(/<(?:\w+:)?ele[^>]*>([^<]+)<\/(?:\w+:)?ele>/i);
      if (eleMatch) eleStr = eleMatch[1].trim();
    }
    if (!nameStr) {
      const nameMatch = raw.match(/<(?:\w+:)?name[^>]*>([^<]+)<\/(?:\w+:)?name>/i);
      if (nameMatch) nameStr = nameMatch[1].trim();
    }
    if (!descStr) {
      const descMatch = raw.match(/<(?:\w+:)?desc[^>]*>([^<]+)<\/(?:\w+:)?desc>/i);
      if (descMatch) descStr = descMatch[1].trim();
    }

    if (!latStr || !lonStr) return null;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      latStr,
      lonStr,
      eleStr,
      nameStr,
      descStr
    };
  }

  function createWaypointElement(doc, fields) {
    const lat = parseFloat(fields.lat);
    const lon = parseFloat(fields.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new Error('Enter a valid Latitude between -90 and 90.');
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new Error('Enter a valid Longitude between -180 and 180.');
    }

    const wptEl = createGpxElement(doc, 'wpt');
    wptEl.setAttribute('lat', String(fields.lat).trim());
    wptEl.setAttribute('lon', String(fields.lon).trim());

    const orderedFields = [
      ['ele', fields.ele],
      ['name', fields.name],
      ['desc', fields.desc],
      ['sym', fields.sym],
      ['type', fields.type]
    ];

    for (let i = 0; i < orderedFields.length; i += 1) {
      const tag = orderedFields[i][0];
      const val = (orderedFields[i][1] || '').trim();
      if (val) {
        const el = createGpxElement(doc, tag);
        el.textContent = val;
        wptEl.appendChild(el);
      }
    }

    return wptEl;
  }

  function buildWaypointXmlString(fields) {
    const doc = createEmptyGpxDoc();
    const wptEl = createWaypointElement(doc, fields);
    return formatXmlNode(wptEl, 0);
  }

  function insertWaypointIntoMainGpx(mainXmlText, fields) {
    const trimmed = (mainXmlText || '').trim();
    const doc = trimmed ? parseXml(trimmed) : createEmptyGpxDoc();
    ensureGpxRoot(doc);

    const wptEl = createWaypointElement(doc, fields);
    const root = doc.documentElement;
    // Insert directly below the <gpx ...> declaration (as first child element)
    root.insertBefore(wptEl, root.firstElementChild);

    return formatXml(doc);
  }

  // =========================================================================
  // Browser UI Controller
  // =========================================================================

  function initApp() {
    if (typeof document === 'undefined') return;

    const MAX_HISTORY = 30;
    const undoStack = [];
    const redoStack = [];
    let currentFileName = 'route.gpx';
    let detectedSourceEle = '';

    // Tabs
    const tabBtnMain = document.getElementById('tab-btn-main');
    const tabBtnWaypoints = document.getElementById('tab-btn-waypoints');
    const tabMain = document.getElementById('tab-main');
    const tabWaypoints = document.getElementById('tab-waypoints');

    // Main Toolbar & Editor
    const fileInput = document.getElementById('file-input');
    const fitInput = document.getElementById('fit-input');
    const btnOpenFile = document.getElementById('btn-open-file');
    const btnLoadFit = document.getElementById('btn-load-fit');
    const btnSaveFile = document.getElementById('btn-save-file');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnSample = document.getElementById('btn-sample');
    const btnClear = document.getElementById('btn-clear');
    const btnCopyXml = document.getElementById('btn-copy-xml');

    const xmlEditor = document.getElementById('xml-editor');
    const dropzone = document.getElementById('editor-dropzone');
    const dropOverlay = document.getElementById('drop-overlay');
    const chkWrap = document.getElementById('chk-wrap');
    const statusBanner = document.getElementById('status-banner');

    // Stats pills
    const statFormat = document.getElementById('stat-format');
    const statStructure = document.getElementById('stat-structure');
    const statPoints = document.getElementById('stat-points');
    const statDistance = document.getElementById('stat-distance');
    const statElevation = document.getElementById('stat-elevation');
    const statLines = document.getElementById('stat-lines');

    // Operations
    const chkRemoveExtensions = document.getElementById('chk-remove-extensions');
    const chkRemoveTime = document.getElementById('chk-remove-time');
    const chkRemoveNonEssential = document.getElementById('chk-remove-nonessential');
    const chkRemoveMetadata = document.getElementById('chk-remove-metadata');
    const chkRemoveEle = document.getElementById('chk-remove-ele');
    const chkRemovePtName = document.getElementById('chk-remove-pt-name');
    const btnCleanTags = document.getElementById('btn-clean-tags');
    const btnFormatXml = document.getElementById('btn-format-xml');

    const btnKmlToGpx = document.getElementById('btn-kml-to-gpx');
    const btnJoinSegments = document.getElementById('btn-join-segments');
    const btnTrkToRte = document.getElementById('btn-trk-to-rte');
    const btnRteToTrk = document.getElementById('btn-rte-to-trk');
    const simplifyToleranceInput = document.getElementById('simplify-tolerance-input');
    const btnSimplifyDp = document.getElementById('btn-simplify-dp');

    const btnUpdateWpNames = document.getElementById('btn-update-wp-names');
    const btnReverse = document.getElementById('btn-reverse');

    const removeMatchMode = document.getElementById('remove-match-mode');
    const removeRangeInput = document.getElementById('remove-range-input');
    const btnRemoveRange = document.getElementById('btn-remove-range');
    const trimStartInput = document.getElementById('trim-start-input');
    const trimEndInput = document.getElementById('trim-end-input');
    const btnTrimPoints = document.getElementById('btn-trim-points');

    // Waypoint Tab
    const wptCombined = document.getElementById('wpt-combined');
    const wptLat = document.getElementById('wpt-lat');
    const wptLon = document.getElementById('wpt-lon');
    const wptName = document.getElementById('wpt-name');
    const wptSym = document.getElementById('wpt-sym');
    const wptType = document.getElementById('wpt-type');
    const wptDesc = document.getElementById('wpt-desc');
    const wptSourcePt = document.getElementById('wpt-source-pt');
    const chkWptKeepEle = document.getElementById('chk-wpt-keep-ele');
    const wptDetectedEle = document.getElementById('wpt-detected-ele');
    const wptOutput = document.getElementById('wpt-output');
    const wptStatus = document.getElementById('wpt-status');

    const btnWptClear = document.getElementById('btn-wpt-clear');
    const btnWptCreate = document.getElementById('btn-wpt-create');
    const btnWptCopy = document.getElementById('btn-wpt-copy');
    const btnWptInsert = document.getElementById('btn-wpt-insert');

    function switchTab(tabName) {
      const isMain = tabName === 'main';
      tabBtnMain.classList.toggle('active', isMain);
      tabBtnMain.setAttribute('aria-selected', String(isMain));
      tabMain.classList.toggle('active', isMain);
      tabMain.classList.toggle('hidden', !isMain);

      tabBtnWaypoints.classList.toggle('active', !isMain);
      tabBtnWaypoints.setAttribute('aria-selected', String(!isMain));
      tabWaypoints.classList.toggle('active', !isMain);
      tabWaypoints.classList.toggle('hidden', isMain);
    }

    tabBtnMain.addEventListener('click', function () {
      switchTab('main');
    });
    tabBtnWaypoints.addEventListener('click', function () {
      switchTab('waypoints');
    });

    function showBanner(el, type, message, actionLabel, actionFn) {
      el.className = 'status-banner ' + type;
      el.textContent = '';
      const span = document.createElement('span');
      span.textContent = message;
      el.appendChild(span);

      if (actionLabel && typeof actionFn === 'function') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-inline-link';
        btn.textContent = actionLabel;
        btn.addEventListener('click', actionFn);
        el.appendChild(btn);
      }
    }

    function hideBanner(el) {
      el.className = 'status-banner hidden';
      el.textContent = '';
    }

    function updateHistoryButtons() {
      btnUndo.disabled = undoStack.length === 0;
      btnRedo.disabled = redoStack.length === 0;
    }

    function pushUndoState(prevValue) {
      if (undoStack.length > 0 && undoStack[undoStack.length - 1] === prevValue) {
        return;
      }
      undoStack.push(prevValue);
      if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
      }
      redoStack.length = 0;
      updateHistoryButtons();
    }

    function applyEditorChange(newValue, message, pushHistory) {
      if (pushHistory !== false) {
        pushUndoState(xmlEditor.value);
      }
      xmlEditor.value = newValue;
      refreshStats();
      if (message) {
        showBanner(statusBanner, 'success', message);
      } else {
        hideBanner(statusBanner);
      }
    }

    function refreshStats() {
      const s = computeStats(xmlEditor.value);
      if (!s.valid) {
        statFormat.textContent = 'Invalid XML';
        statStructure.textContent = 'Check syntax';
        statPoints.textContent = '—';
        statDistance.textContent = '—';
        statElevation.textContent = 'Ele: —';
        statLines.textContent = s.lineCount.toLocaleString() + ' lines';
        return;
      }

      statFormat.textContent = s.format;
      if (s.empty) {
        statStructure.textContent = '0 tracks • 0 routes';
        statPoints.textContent = '0 points • 0 wpt';
        statDistance.textContent = '0.00 km (0.00 mi)';
        statElevation.textContent = 'Ele: —';
        statLines.textContent = '0 lines';
        return;
      }

      statStructure.textContent =
        s.tracks + ' trk (' + s.segments + ' seg) • ' + s.routes + ' rte';

      const ptTotal = s.trkpts + s.rtepts;
      const rangeSuffix = s.wpRange ? ' (' + s.wpRange + ')' : '';
      statPoints.textContent = ptTotal.toLocaleString() + ' pts' + rangeSuffix + ' • ' + s.wpts + ' wpt';

      const km = s.distanceMeters / 1000;
      const mi = km * 0.621371;
      statDistance.textContent = km.toFixed(2) + ' km (' + mi.toFixed(2) + ' mi)';
      statElevation.textContent =
        s.elevationGain !== null ? 'Gain: +' + s.elevationGain.toLocaleString() + ' m' : 'Ele: —';
      statLines.textContent = s.lineCount.toLocaleString() + ' lines';
    }

    function runTransform(fn) {
      try {
        const doc = parseXml(xmlEditor.value);
        const result = fn(doc);
        applyEditorChange(result.xml, result.message, true);
      } catch (err) {
        showBanner(statusBanner, 'error', err.message || 'Operation failed.');
      }
    }

    async function copyTextToClipboard(text, targetBanner, label) {
      if (!text) {
        showBanner(targetBanner, 'error', 'Nothing to copy.');
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const temp = document.createElement('textarea');
          temp.value = text;
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }
        showBanner(targetBanner, 'success', label + ' copied to clipboard.');
      } catch (_err) {
        showBanner(targetBanner, 'error', 'Clipboard copy was blocked by the browser. Select and copy manually.');
      }
    }

    // Debounced live stats update on typing/pasting
    let statsTimer = null;
    xmlEditor.addEventListener('input', function () {
      clearTimeout(statsTimer);
      statsTimer = setTimeout(refreshStats, 120);
    });

    chkWrap.addEventListener('change', function () {
      xmlEditor.wrap = chkWrap.checked ? 'soft' : 'off';
    });

    // Undo / Redo
    btnUndo.addEventListener('click', function () {
      if (undoStack.length === 0) return;
      redoStack.push(xmlEditor.value);
      xmlEditor.value = undoStack.pop();
      updateHistoryButtons();
      refreshStats();
      showBanner(statusBanner, 'info', 'Undid last change.');
    });

    btnRedo.addEventListener('click', function () {
      if (redoStack.length === 0) return;
      undoStack.push(xmlEditor.value);
      xmlEditor.value = redoStack.pop();
      updateHistoryButtons();
      refreshStats();
      showBanner(statusBanner, 'info', 'Redid change.');
    });

    // Clear & Sample
    btnClear.addEventListener('click', function () {
      if (!xmlEditor.value) return;
      applyEditorChange('', 'Editor cleared.', true);
    });

    btnSample.addEventListener('click', async function () {
      let xmlText = SAMPLE_GPX_XML;
      if (
        typeof fetch === 'function' &&
        typeof window !== 'undefined' &&
        window.location &&
        /^https?:$/i.test(window.location.protocol)
      ) {
        try {
          const resp = await fetch('Cycle%20on%20the%20Moss.gpx');
          if (resp && resp.ok) {
            const fetched = await resp.text();
            if (fetched && fetched.trim()) {
              xmlText = fetched;
            }
          }
        } catch (_err) {
          // Fall back to embedded SAMPLE_GPX_XML
        }
      }
      currentFileName = 'Cycle on the Moss.gpx';
      applyEditorChange(xmlText, 'Loaded sample "Cycle on the Moss.gpx".', true);
    });

    // File Loading (.gpx, .kml, .fit, .xml)
    function loadUploadedFile(file) {
      if (!file) return;
      const lower = file.name.toLowerCase();
      currentFileName = file.name.replace(/\.(kml|fit|xml)$/i, '.gpx');
      if (!currentFileName.toLowerCase().endsWith('.gpx')) {
        currentFileName += '.gpx';
      }

      if (lower.endsWith('.fit')) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          try {
            const res = parseFitToGpx(ev.target.result, file.name);
            applyEditorChange(
              res.xml,
              'Converted FIT file "' +
                file.name +
                '" to GPX (' +
                res.trackPointCount.toLocaleString() +
                ' track points, ' +
                res.waypointCount +
                ' waypoints).',
              true
            );
          } catch (err) {
            showBanner(statusBanner, 'error', 'FIT Conversion Error: ' + err.message);
          }
        };
        reader.onerror = function () {
          showBanner(statusBanner, 'error', 'Failed to read file "' + file.name + '".');
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = function (ev) {
          applyEditorChange(
            String(ev.target.result || ''),
            'Loaded "' + file.name + '".',
            true
          );
        };
        reader.onerror = function () {
          showBanner(statusBanner, 'error', 'Failed to read file "' + file.name + '".');
        };
        reader.readAsText(file, 'utf-8');
      }
    }

    btnOpenFile.addEventListener('click', function () {
      fileInput.value = '';
      fileInput.click();
    });

    btnLoadFit.addEventListener('click', function () {
      fitInput.value = '';
      fitInput.click();
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) {
        loadUploadedFile(fileInput.files[0]);
      }
    });

    fitInput.addEventListener('change', function () {
      if (fitInput.files && fitInput.files[0]) {
        loadUploadedFile(fitInput.files[0]);
      }
    });

    // Drag & Drop on Editor
    let dragDepth = 0;
    dropzone.addEventListener('dragenter', function (e) {
      e.preventDefault();
      dragDepth += 1;
      dropOverlay.classList.remove('hidden');
    });
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
    });
    dropzone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        dropOverlay.classList.add('hidden');
      }
    });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dragDepth = 0;
      dropOverlay.classList.add('hidden');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadUploadedFile(e.dataTransfer.files[0]);
      }
    });

    // Save & Copy
    btnSaveFile.addEventListener('click', function () {
      const content = xmlEditor.value;
      if (!content.trim()) {
        showBanner(statusBanner, 'error', 'Nothing to save — the XML editor is empty.');
        return;
      }
      let downloadName = currentFileName || 'route.gpx';
      try {
        const doc = parseXml(content);
        const nameEl =
          getFirstDirectChild(getFirstDirectChild(doc.documentElement, 'trk'), 'name') ||
          getFirstDirectChild(getFirstDirectChild(doc.documentElement, 'rte'), 'name') ||
          getFirstDirectChild(getFirstDirectChild(doc.documentElement, 'metadata'), 'name');
        if (nameEl && nameEl.textContent.trim() && downloadName === 'route.gpx') {
          const safe = nameEl.textContent
            .trim()
            .replace(/[^a-z0-9_\- ]/gi, '')
            .replace(/\s+/g, '_');
          if (safe) downloadName = safe + '.gpx';
        }
      } catch (_err) {
        // Save raw text even if invalid
      }
      const blob = new Blob([content], { type: 'application/gpx+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showBanner(statusBanner, 'success', 'Saved "' + downloadName + '".');
    });

    btnCopyXml.addEventListener('click', function () {
      copyTextToClipboard(xmlEditor.value, statusBanner, 'XML');
    });

    // Transformation Buttons
    btnFormatXml.addEventListener('click', function () {
      runTransform(function (doc) {
        return {
          xml: formatXml(doc),
          message: 'Reformatted XML with 2-space indentation.'
        };
      });
    });

    btnCleanTags.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = removeUnwantedTags(doc, {
          removeExtensions: chkRemoveExtensions.checked,
          removeTime: chkRemoveTime.checked,
          removeNonEssential: chkRemoveNonEssential.checked,
          removeMetadata: chkRemoveMetadata.checked,
          removeEle: chkRemoveEle.checked,
          removePtName: chkRemovePtName ? chkRemovePtName.checked : false
        });
        return {
          xml: res.xml,
          message:
            'Removed ' +
            res.removedElements.toLocaleString() +
            ' tag(s) and ' +
            res.removedNsAttrs +
            ' unused namespace attribute(s).'
        };
      });
    });

    btnKmlToGpx.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = convertKmlToGpx(doc);
        return {
          xml: res.xml,
          message:
            'Converted KML to GPX (' +
            res.trackCount +
            ' track(s), ' +
            res.waypointCount +
            ' waypoint(s)).'
        };
      });
    });

    btnJoinSegments.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = joinTrackSegments(doc);
        return {
          xml: res.xml,
          message:
            res.mergedSegments > 0
              ? 'Joined ' + res.mergedSegments + ' extra <trkseg> segment(s).'
              : 'All tracks already have a single <trkseg>.'
        };
      });
    });

    btnTrkToRte.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = convertTracksToRoutes(doc);
        return {
          xml: res.xml,
          message:
            'Converted ' +
            res.convertedCount +
            ' track(s) to route(s) (' +
            res.totalAfter.toLocaleString() +
            ' points).'
        };
      });
    });

    btnRteToTrk.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = convertRoutesToTracks(doc);
        return {
          xml: res.xml,
          message:
            'Converted ' +
            res.convertedCount +
            ' route(s) to track(s) (' +
            res.totalPoints.toLocaleString() +
            ' points).'
        };
      });
    });

    function handleNumberPoints() {
      runTransform(function (doc) {
        const res = numberTrackAndRoutePoints(doc);
        return {
          xml: res.xml,
          message:
            'Named ' +
            res.totalNamed.toLocaleString() +
            ' point(s) sequentially (WP0001–' +
            formatWpName(res.totalNamed) +
            ').'
        };
      });
    }

    btnUpdateWpNames.addEventListener('click', handleNumberPoints);

    btnReverse.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = reverseTracksAndRoutes(doc);
        return {
          xml: res.xml,
          message: 'Reversed ' + res.reversedPoints.toLocaleString() + ' point(s).'
        };
      });
    });

    btnRemoveRange.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = removePointsByRange(doc, removeRangeInput.value, removeMatchMode.value);
        return {
          xml: res.xml,
          message:
            'Removed ' +
            res.removed.toLocaleString() +
            ' point(s) (' +
            res.remaining.toLocaleString() +
            ' remaining; not renumbered).'
        };
      });
    });

    btnTrimPoints.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = trimPointsByStartEnd(
          doc,
          trimStartInput.value,
          trimEndInput.value,
          removeMatchMode.value
        );
        return {
          xml: res.xml,
          message:
            'Trimmed ' +
            res.removed.toLocaleString() +
            ' point(s) (' +
            res.remaining.toLocaleString() +
            ' remaining; not renumbered).'
        };
      });
    });

    btnSimplifyDp.addEventListener('click', function () {
      runTransform(function (doc) {
        const tol = parseFloat(simplifyToleranceInput.value);
        if (!Number.isFinite(tol) || tol <= 0) {
          throw new Error('Enter a valid tolerance in meters greater than 0 (e.g. 10).');
        }
        const res = simplifyTracksAndRoutes(doc, tol);
        return {
          xml: res.xml,
          message:
            'Simplified (tolerance ' +
            tol +
            'm): ' +
            res.totalBefore.toLocaleString() +
            ' → ' +
            res.totalAfter.toLocaleString() +
            ' point(s) (removed ' +
            res.removedCount.toLocaleString() +
            ').'
        };
      });
    });

    // Waypoint Tab Reactivity & Actions
    wptCombined.addEventListener('input', function () {
      const parsed = parseCombinedLatLon(wptCombined.value);
      if (parsed) {
        wptLat.value = parsed.latStr;
        wptLon.value = parsed.lonStr;
      }
    });

    function syncLatLonToCombined() {
      const lat = wptLat.value.trim();
      const lon = wptLon.value.trim();
      if (lat || lon) {
        wptCombined.value = lat && lon ? lat + ', ' + lon : lat + lon;
      } else {
        wptCombined.value = '';
      }
    }

    wptLat.addEventListener('input', syncLatLonToCombined);
    wptLon.addEventListener('input', syncLatLonToCombined);

    wptSourcePt.addEventListener('input', function () {
      const parsed = parseSourcePointSnippet(wptSourcePt.value);
      if (!parsed) {
        detectedSourceEle = '';
        wptDetectedEle.classList.add('hidden');
        wptDetectedEle.textContent = '';
        return;
      }
      wptLat.value = parsed.latStr;
      wptLon.value = parsed.lonStr;
      wptCombined.value = parsed.latStr + ', ' + parsed.lonStr;
      detectedSourceEle = parsed.eleStr || '';
      if (detectedSourceEle) {
        wptDetectedEle.textContent = 'Detected <ele>: ' + detectedSourceEle + ' m';
        wptDetectedEle.classList.remove('hidden');
      } else {
        wptDetectedEle.classList.add('hidden');
        wptDetectedEle.textContent = '';
      }
      if (!wptName.value.trim() && parsed.nameStr) {
        wptName.value = parsed.nameStr;
      }
      if (!wptDesc.value.trim() && parsed.descStr) {
        wptDesc.value = parsed.descStr;
      }
    });

    function collectWaypointFields() {
      return {
        lat: wptLat.value.trim(),
        lon: wptLon.value.trim(),
        ele: chkWptKeepEle.checked ? detectedSourceEle : '',
        name: wptName.value.trim(),
        sym: wptSym.value,
        type: wptType.value,
        desc: wptDesc.value.trim()
      };
    }

    btnWptClear.addEventListener('click', function () {
      wptCombined.value = '';
      wptLat.value = '';
      wptLon.value = '';
      wptName.value = '';
      wptSym.value = '';
      wptType.value = '';
      wptDesc.value = '';
      wptSourcePt.value = '';
      wptOutput.value = '';
      detectedSourceEle = '';
      wptDetectedEle.classList.add('hidden');
      wptDetectedEle.textContent = '';
      hideBanner(wptStatus);
    });

    btnWptCreate.addEventListener('click', function () {
      try {
        const xml = buildWaypointXmlString(collectWaypointFields());
        wptOutput.value = xml;
        showBanner(wptStatus, 'success', 'Created GPX <wpt> element.');
      } catch (err) {
        showBanner(wptStatus, 'error', err.message);
      }
    });

    btnWptCopy.addEventListener('click', function () {
      try {
        const xml = buildWaypointXmlString(collectWaypointFields());
        wptOutput.value = xml;
        copyTextToClipboard(xml, wptStatus, 'Waypoint');
      } catch (err) {
        showBanner(wptStatus, 'error', err.message);
      }
    });

    btnWptInsert.addEventListener('click', function () {
      try {
        const fields = collectWaypointFields();
        const wptPreview = buildWaypointXmlString(fields);
        wptOutput.value = wptPreview;

        const updatedMainXml = insertWaypointIntoMainGpx(xmlEditor.value, fields);
        applyEditorChange(
          updatedMainXml,
          'Added waypoint' + (fields.name ? ' "' + fields.name + '"' : '') + ' below <gpx> declaration.',
          true
        );
        showBanner(
          wptStatus,
          'success',
          'Added waypoint directly below <gpx> declaration in the main tab.',
          'View in Main Tab',
          function () {
            switchTab('main');
          }
        );
      } catch (err) {
        showBanner(wptStatus, 'error', err.message);
      }
    });

    refreshStats();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }

  // Export core functions for automated testing in Node/test runners
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      parseXml,
      formatXml,
      computeStats,
      simplifyPointsDP,
      simplifyTracksAndRoutes,
      removeUnwantedTags,
      joinTrackSegments,
      convertTracksToRoutes,
      convertRoutesToTracks,
      numberTrackAndRoutePoints,
      reverseTracksAndRoutes,
      removePointsByRange,
      trimPointsByStartEnd,
      convertKmlToGpx,
      parseFitToGpx,
      parseCombinedLatLon,
      parseSourcePointSnippet,
      buildWaypointXmlString,
      insertWaypointIntoMainGpx,
      SAMPLE_GPX_XML
    };
  }
})();
