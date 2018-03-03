#!/usr/bin/env ruby

require 'sinatra'
require 'json'

set :bind, '172.17.0.1'
set :port, 4567

def dist_check(star1, star2, dist)
  (star1.x - star2.x) ** 2 + (star1.y - star2.y) ** 2 > dist ** 2
end

class Star
  attr_reader :x, :y

  def initialize(x, y)
    @x = x
    @y = y
  end

  def hash
    [x, y].hash
  end

  def eql?(other)
    x == other.x && y == other.y
  end

  def to_json(options = nil)
    {x: x, y: y}.to_json(options)
  end

  def ==(other)
    x == other.x && y == other.y
  end
end

class Connection
  attr_reader :star1, :star2

  def initialize(star1, star2)
    @star1 = star1
    @star2 = star2
  end

  def hash
    star1.hash + star2.hash
  end

  def eql?(other)
    self == other
  end

  def ==(other)
    (star1 == other.star1 && star2 == other.star2) ||
    (star1 == other.star2 && star2 == other.star1)
  end

  def to_json(options)
    {star1: star1, star2: star2}.to_json(options)
  end
end

def generate_field
  stars = 2500.times.reduce([]) {|s, _|
    x = (Random.rand * 15000).floor - 7500
    y = (Random.rand * 10000).floor - 5000
    star = Star.new(x, y)
    s << star if s.all? {|check| dist_check(star, check, 70)}
    s
  }

  connections = []

  [stars, connections]
end

stars, connections = generate_field

trap :HUP do
  stars, connections = generate_field
end

before do
  headers \
    "Access-Control-Allow-Origin" => '*',
    "Content-Type" => 'text/json'
end

get '/' do
  headers 'Content-Type' => "text/html"
  body \
    "This is a RESTful backend for the Constellations project.\n" \
    "<br/>\n" \
    "It is not meant to be reached by a browser."
end

get '/stars' do
  body JSON.dump(stars)
end

get '/connections' do
  body JSON.dump(connections)
end

delete '/connections' do
  begin
    request.body.rewind
    json = JSON.parse(request.body.read)
    cons = json.map {|connection|
      Connection.new(Star.new(*connection['star1']), Star.new(*connection['star2']))
    }
    p connections
    p cons
    p connections[0].hash
    p cons[0].hash
    p (connections - cons)
    connections -= cons
    "OK\n"
  rescue JSON::JSONError => e
    puts e.inspect
    halt 400, 'Malformed JSON'
  rescue => e
    puts e.inspect
    halt 500, 'Internal server error'
  end
end

options '/*' do
  headers \
    "Access-Control-Allow-Origin" => '*',
    "Access-Control-Allow-Methods" => "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers" => "X-PINGOTHER, Content-Type"
end

post '/connections' do
  begin
    request.body.rewind
    json = JSON.parse(request.body.read)
    cons = json.map {|connection|
      Connection.new(Star.new(*connection['star1']), Star.new(*connection['star2']))
    }
    connections += cons.select {|connection|
      !connections.include?(connection)
    }
    "OK\n"
  rescue JSON::JSONError => e
    puts e.inspect
    halt 400, 'Malformed JSON'
  rescue => e
    puts e.inspect
    halt 500, 'Internal server error'
  end
end
