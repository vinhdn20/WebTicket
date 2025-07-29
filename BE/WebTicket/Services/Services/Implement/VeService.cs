using Common;
using Repositories.Entities;
using Repositories.Interfaces;
using Repositories.Models;
using Services.Services.Interfaces;
using System.Linq.Expressions;
using System.Reflection;

namespace Services.Services.Implement
{
    public class VeService : BasicOperationService<ThongTinVe>, IVeService
    {
        public VeService(IDBRepository repository) : base(repository)
        {
        }

        public async Task<TableInfo<ThongTinVe>> Filter(TablePageParameter pageParameter)
        {
            var dbQueryParameter = InitQueryParameter(pageParameter);
            dbQueryParameter.IncludedPropertyList = new List<string> { "AGCustomer", "VeDetail", "Card" };
            var thongTinVe = await _repository.GetAllWithPagingAsync(dbQueryParameter);
            return thongTinVe;
        }

        protected override Expression<Func<ThongTinVe, bool>> CreateFilter(TablePageParameter tablePageParameter)
        {
            Expression<Func<ThongTinVe, bool>> filterExpression = FillterBuilder.True<ThongTinVe>();
            var filters = tablePageParameter.Filters;
            if (!filters.Any())
            {
                return filterExpression;
            }
            filters = filters
                        .ToDictionary(
                            kvp => kvp.Key.ToLower(),  
                            kvp => kvp.Value  
                        );
            if (tablePageParameter.Filters.Any())
            {
                var stringProperties = typeof(ThongTinVe)
        .GetProperties()
        .Where(prop => prop.PropertyType == typeof(string) ||
                        (prop.PropertyType.IsClass && prop.PropertyType.IsSubclassOf(typeof(BaseEntity))))
        .ToList();

                foreach (var prop in stringProperties)
                {
                    var filterKey = prop.Name.ToLower();
                    if (filters.ContainsKey(filterKey))
                    {
                        var values = filters[filterKey].Select(s => s.ToLower()).ToList();
                        if (prop.PropertyType == typeof(string))
                        {
                            filterExpression = FilterWithString(filterExpression, values, prop);
                        }
                    }
                    else if (prop.PropertyType != typeof(string))
                    {
                        var nestedProperties = prop.PropertyType
                        .GetProperties()
                        .Where(nestedProp => nestedProp.PropertyType == typeof(string))
                        .ToList();

                        foreach (var nestedProp in nestedProperties)
                        {
                            var nestedFilterKey = nestedProp.Name.ToLower();

                            if (filters.ContainsKey(nestedFilterKey))
                            {
                                var nestedValues = filters[nestedFilterKey].Select(s => s.ToLower()).ToList();

                                if (nestedValues is null || nestedValues.Count == 0) continue;
                                var parameter = Expression.Parameter(typeof(ThongTinVe));

                                var parentProperty = Expression.Property(parameter, prop.Name);
                                var nestedProperty = Expression.Property(parentProperty, nestedProp.Name);

                                var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes);
                                var lowerCaseNestedProperty = Expression.Call(nestedProperty, toLowerMethod);

                                var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                var nestedValuesExpression = Expression.Constant(nestedValues.FirstOrDefault());
                                var containsNestedExpression = Expression.Call(lowerCaseNestedProperty, containsMethod, nestedValuesExpression);

                                var nestedLambda = Expression.Lambda<Func<ThongTinVe, bool>>(containsNestedExpression, parameter);
                                filterExpression = filterExpression.And(nestedLambda);
                            }
                        }
                    }
                }
            }
            return filterExpression;
        }

        private Expression<Func<ThongTinVe, bool>> FilterWithString(Expression<Func<ThongTinVe, bool>> filterExpression, List<string>? values, PropertyInfo? prop)
        {
            if (values is null || values.Count() == 0) { return filterExpression; }
            var parameter = Expression.Parameter(typeof(ThongTinVe));
            var property = Expression.Property(parameter, prop.Name);
            var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes);
            var lowerCaseProperty = Expression.Call(property, toLowerMethod);

            var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) });

            var valuesExpression = Expression.Constant(values.FirstOrDefault());
            var containsExpression = Expression.Call(lowerCaseProperty, containsMethod, valuesExpression);

            var lambda = Expression.Lambda<Func<ThongTinVe, bool>>(containsExpression, parameter);
            filterExpression = filterExpression.And(lambda);
            return filterExpression;
        }

        protected override Sorter<ThongTinVe, object> MapSortColumn(string sortKey)
        {
            Sorter<ThongTinVe, object> sorter = new Sorter<ThongTinVe, object>();
            switch ((sortKey ?? "").ToLower())
            {
                //case Constants.ThongTinVe.:
                //    sorter.SortBy = s => s.User.DisplayName;
                //    sorter.ThenSortBy = s => s.User.Code;
                //    break;
                //case Constants.TableSortColumn.Code:
                default:
                    sorter.SortBy = s => s.ModifiedTime;
                    sorter.ThenSortBy = s => s.CreatedTime;
                    break;
            }
            return sorter;
        }
    }
}
