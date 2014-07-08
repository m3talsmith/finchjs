class Finch
	tree: null

	constructor: ->
		@tree = new Finch.Tree()
	#END constructor

	__run__: (default_return, routine) ->
		try
			return routine.call(@)
		catch ex
			if ex instanceof Finch.Error
				if ex instanceof Finch.NotFoundError
					@trigger("not_found", ex)
				else
					@trigger("error", ex)
				#END if
			else
				throw ex
			#END if
		#END try

		return default_return
	#END __run__

	route: (route_string, callbacks) -> @__run__ @, ->
		node = @tree.addRoute(route_string)
		node.setCallbacks(callbacks)
		return @
	#END route


	call: (route_string) -> @__run__ @, ->
		@tree.callRoute(route_string)
		return @
	#END call

	reload: -> @__run__ @, ->
		@tree.load_path.reload()
		return @
	#END reload

	peek: -> @__run__ null, ->
		return ""
	#END peek

	# Has dispose method
	observe: (args...) -> @__run__ null, ->
		observer = new Finch.Observer.create(args...)
		@tree.load_path.addObserver(observer)
		return observer
	#END observe

	abort: -> @__run__ @, ->
		@tree.load_path.abort()
		return @
	#END abort

	listen: -> @__run__ false, -> Finch.UriManager.listen()
	ignore: -> @__run__ false, -> Finch.UriManager.ignore()

	navigate: (uri, params, do_update) -> @__run__ @, ->
		Finch.UriManager.navigate(uri, params, do_update)
		return @
	#END navigate

	reset: -> @__run__ @, ->
		@tree.load_path.abort()
		@tree = new Finch.Tree()
		return @
	#END reset

	options: (key, value) -> @__run__ @, ->
		if isObject(key)
			@options(k, v) for k, v of key
			return @
		#END if

		switch key
			when 'coerce_types', 'CoerceParameterTypes'
				@tree.load_path.coerce_types = value
			#END when
		#END switch

		return @
	#END options

	# error, (status, message) ->
	# not_found, ->
	# load, (route)
	# unload, (route)
	# setup, (route)
	# teardown, (route)
	on: ->
	off: ->
	trigger: ->
#END Finch